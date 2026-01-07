const http = require("http");
const { exec } = require("child_process");

const PORT = 9000;

http.createServer((req, res) => {
  if (req.method !== "POST") {
    res.statusCode = 200;
    return res.end("OK");
  }

  exec("bash /var/www/MentorBro-Backend/deploy.sh", (err, stdout, stderr) => {
    if (err) {
      console.error(err);
      res.statusCode = 500;
      return res.end("Deploy failed");
    }

    console.log(stdout);
    res.end("Deploy success");
  });
}).listen(PORT, () => {
  console.log(`🚀 GitHub Webhook listening on ${PORT}`);
});
