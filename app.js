var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cors = require("cors");
const bodyParser = require("body-parser");

require("dotenv").config();

// //Routes
var indexRouter = require("./routes/index"); //predefin
var authRouter = require("./routes/authentication"); //predefined
var ticketRouter = require("./routes/ticket"); //predefined
var pmsRouter = require("./routes/pms"); //predefined
var pmsticketRouter = require("./routes/pmsticket"); //predefined
var announcementsRouter = require("./routes/announcements"); //predefined
var knowledgebaseRouter = require("./routes/knowledgebase"); //predefine
var tatRouter = require("./routes/tat"); //predefined

// var requestRouter = require('./routes/request');

const session = require("express-session");
var MemoryStore = require("memorystore")(session);

var corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"],
  optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  credentials: true, //Credentials are cookies, authorization headers or TLS client certificates.
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "device-remember-token",
    "Access-Control-Allow-Origin",
    "Origin",
    "Accept",
    "app_id ",
    "user",
    "password ",
  ],
};

var app = express();
app.use(cors(corsOptions));
app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  "/api/noteuploads",
  express.static(path.join(__dirname, "noteuploads")),
);

app.use("api/esignatures", express.static(path.join(__dirname, "esignatures")));
// Custom static file serving with CORS

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    cookie: { maxAge: 3600000 },
    store: new MemoryStore({
      checkPeriod: 3600000,
    }),
    resave: false,
    secret: "LCMC_COR",
    saveUninitialized: false,
  }),
);

var whitelist = [
  "https://ithd-fe-three.vercel.app",
  process.env.FRONTEND_URL,
  "http://localhost:3007",
  "http://127.0.0.1:3007",
  "http://localhost:5007",
  "http://192.168.44.26",
  "http://192.168.44.26:3007",
  "https://192.168.44.26:443",
  "https://192.168.44.26:444",
].filter(Boolean);

// -ExecutionPolicy Bypass -File "D:\LMD WebApps\App Scripts\ARMS\run_ARMS_MW.ps1

//calling of routes
app.use("/", indexRouter);
app.use("/api/authentication", authRouter);
app.use("/api/ticket", ticketRouter);
app.use("/api/announcements", announcementsRouter);
app.use("/api/knowledgebase", knowledgebaseRouter);
app.use("/api/pms", pmsRouter);
app.use("/api/tat", tatRouter);

app.use("/api/pmsticket", pmsticketRouter);
// app.use('/api/headermaster',headerMasterRouter);

app.set("trust proxy", true);
app.use(
  session({
    cookie: { maxAge: 3600000, sameSite: "none", secure: true },
    store: new MemoryStore({
      checkPeriod: 3600000,
    }),
    resave: false,
    secret: process.env.SESSION_SECRET,
    saveUninitialized: false,
  }),
);
// // catch 404 and forward to error handler
// app.use(function(req, res, next) {
//   next(createError(404));
// });

// // error handler
// app.use(function(err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
