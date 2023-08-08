const express = require("express");
const fs = require("fs");
const http = require("http");
const PORT = 8000;
const app = express();
const path = require("path");
const helper = require("./helper");
const csvParser = require("csv-parser");
const multer = require("multer");

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Set up multer for handling form-data
const upload = multer({ dest: "uploads/" });

app.get("/", () => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/send-invite", upload.single("import-csv"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      status_code: 400,
      message: "No file uploaded.",
    });
  }
  const filePath = req.file.path;
  const csvData = [];
  fs.createReadStream(filePath)
    .pipe(csvParser())
    .on("data", (data) => {
      csvData.push(data);
    })
    .on("end", () => {
      const { status_code, message } = helper.process_csv_formdata(csvData);
      let response = {
        status_code,
        message,
      };
      console.log(response);
      res.status(response["status_code"]).json(response);
    })
    .on("error", (error) => {
      console.error("Error parsing CSV:", error);
      res.status(500).send({
        status_code: 500,
        message: "Something went wrong",
      });
    });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
