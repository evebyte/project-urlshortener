// Load required modules
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dns = require("dns");
const url = require("url");
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// Enable CORS so that the API is remotely testable by FCC
app.use(cors());

// Use body-parser middleware to handle POST requests
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
	res.sendFile(process.cwd() + "/views/index.html");
});

// Initialize an object to store the URLs
const urlDatabase = {};

// Generate a short URL
// 1. Get the current number of URLs in the database
// 2. Increment the number by 1 and return it
const generateShortUrl = () => {
	const shortUrl = Object.keys(urlDatabase).length + 1;
	return shortUrl;
};

// Validate URL format
// 1. Define a regular expression for URL format
// 2. Test the URL string against the regular expression and return the result
const validateUrlFormat = (urlString) => {
	const urlFormat =
		/^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;
	return urlFormat.test(urlString);
};

// POST endpoint to create short URLs
// 1. Get the original URL from the request body
// 2. Check if the URL has a valid format using validateUrlFormat function
// 3. If the URL format is invalid, return an error message
// 4. If the URL format is valid, parse the URL to extract the hostname
// 5. Check if the hostname is valid using dns.lookup
// 6. If the hostname is invalid, return an error message
// 7. If the hostname is valid, generate a short URL, store it in the database, and return it in the response
app.post("/api/shorturl", function (req, res) {
	const originalUrl = req.body.url;
	const isValidUrlFormat = validateUrlFormat(originalUrl);

	if (!isValidUrlFormat) {
		return res.json({ error: "invalid url" });
	}

	const urlObject = url.parse(originalUrl);

	dns.lookup(urlObject.hostname, (error) => {
		if (error) {
			res.json({ error: "invalid url" });
		} else {
			const shortUrl = generateShortUrl();
			urlDatabase[shortUrl] = originalUrl;
			res.json({ original_url: originalUrl, short_url: shortUrl });
		}
	});
});

// GET endpoint to redirect short URLs to their original URLs
// 1. Get the short URL from the request parameters
// 2. Check if the short URL exists in the database
// 3. If it exists, redirect to the original URL
// 4. If it does not exist, return a 404 status with a "Not found" message
app.get("/api/shorturl/:short_url", function (req, res) {
	const shortUrl = req.params.short_url;
	const originalUrl = urlDatabase[shortUrl];

	if (originalUrl) {
		res.redirect(originalUrl);
	} else {
		res.status(404).send("Not found");
	}
});

// Start the server
app.listen(port, function () {
	console.log(`Listening on port ${port}`);
});
