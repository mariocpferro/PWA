const { spawn, execSync } = require("child_process");
const https = require("https");
const os = require("os");
const fs = require("fs");
const path = require("path");

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  // Prioridade: Ethernet > Wi-Fi > qualquer outra interface não interna
  const priority = [/^ethernet/i, /^wi-fi/i, /^wlan/i, /^en\d/i, /^eth\d/i];
  for (const pattern of priority) {
    for (const name of Object.keys(interfaces)) {
      if (!pattern.test(name)) continue;
      for (const iface of interfaces[name]) {
        if (iface.family === "IPv4" && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  // Fallback: qualquer IPv4 não interno
  for (const ifaces of Object.values(interfaces)) {
    for (const iface of ifaces) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

function ensureCerts(ip) {
  const certsDir = path.join(__dirname, "..", "certs");
  const certFile = path.join(certsDir, "local.pem");
  const keyFile = path.join(certsDir, "local-key.pem");
  const ipFile = path.join(certsDir, "ip.txt");

  if (!fs.existsSync(certsDir)) fs.mkdirSync(certsDir);

  const lastIP = fs.existsSync(ipFile) ? fs.readFileSync(ipFile, "utf8").trim() : null;
  const certsExist = fs.existsSync(certFile) && fs.existsSync(keyFile);

  if (certsExist && lastIP === ip) {
    return { certFile, keyFile };
  }

  console.log(`  Gerando certificado HTTPS para localhost e ${ip}...`);
  try {
    execSync(`mkcert -install`, { stdio: "inherit" });
    execSync(
      `mkcert -cert-file "${certFile}" -key-file "${keyFile}" localhost 127.0.0.1 ${ip}`,
      { stdio: "inherit" }
    );
    fs.writeFileSync(ipFile, ip);
    console.log("  Certificado gerado com sucesso.\n");
  } catch {
    console.error("\n  ERRO: mkcert não encontrado. Instale com:");
    console.error("  choco install mkcert  (ou baixe em https://mkcert.dev)\n");
    process.exit(1);
  }

  return { certFile, keyFile };
}

const command = process.argv[2] || "dev";
const ip = getLocalIP();

if (!ip) {
  console.error("Não foi possível detectar o IP da rede. Verifique sua conexão.");
  process.exit(1);
}

const { certFile, keyFile } = ensureCerts(ip);

console.log(`\n  IP da rede detectado: ${ip}`);
console.log(`  Acesse de outros dispositivos: https://${ip}:3000\n`);

// AUTH_URL must be set in process.env BEFORE Next.js loads .env files,
// otherwise .env.production.local's AUTH_URL="" would override it.
process.env.AUTH_URL = `https://${ip}:3000`;

const env = { ...process.env };

if (command === "start") {
  // next start não suporta --experimental-https, então usamos servidor HTTPS nativo do Node
  const next = require("next");
  const app = next({ dev: false, dir: path.join(__dirname, "..") });
  const handle = app.getRequestHandler();

  app.prepare().then(() => {
    const server = https.createServer(
      {
        key: fs.readFileSync(keyFile),
        cert: fs.readFileSync(certFile),
      },
      (req, res) => handle(req, res)
    );

    server.listen(3000, "0.0.0.0", () => {
      console.log(`  Servidor de produção iniciado.`);
      console.log(`  Local:   https://localhost:3000`);
      console.log(`  Rede:    https://${ip}:3000\n`);
    });
  });
} else {
  const nextArgs = `next dev -H 0.0.0.0 --experimental-https --experimental-https-cert certs/local.pem --experimental-https-key certs/local-key.pem`;

  const proc = spawn(nextArgs, [], {
    env,
    stdio: "inherit",
    shell: true,
    cwd: path.join(__dirname, ".."),
  });

  proc.on("exit", (code) => process.exit(code));
}
