module.exports = {
  apps: [{
    name: "curebery",
    script: "./artifacts/api-server/dist/index.mjs",
    cwd: "/home/curebery/curebery",
    env: {
      PORT: "8080",
      NODE_ENV: "production"
    }
  }]
}
