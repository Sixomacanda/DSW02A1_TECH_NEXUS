const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "users_sign"
});

db.connect(err => {
  if(err) throw err;
  console.log("Database connected");
});