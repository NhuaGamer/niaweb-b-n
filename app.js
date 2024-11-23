const express = require("express");
const session = require("express-session");
const ejs = require("ejs");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const path = require("path");
const app = express()

const db = mysql.createConnection({
  host: 'biwrjd52s3atmsirhtco-mysql.services.clever-cloud.com',
  user: 'uxgg9lya6jkwgixp',
  password: 'bIoHwUTKlWPQsuDuIc4S',
  database: 'biwrjd52s3atmsirhtco'
})
db.connect((err)=> {
  if (err) {
    console.error('MySQl Not Connect '+err)
  } else {
    console.log('MySQL Connected')
  }
})

app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(session( {
  secret: 'node',
  resave: false,
  saveUninitialized: true
}))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

function IfLoggedIn(req, res, next) {
  if (req.session.user) {
    return res.redirect('/')
  }
  next()
}

app.get('/', Video, (req, res)=> {
  res.render('index', {
    user: req.session.user
  })
})
app.get('/login', IfLoggedIn, (req, res)=> {
  res.render('login')
})
app.get('/about', (req, res)=> {
  res.render('about', {
    user: req.session.user
  })
})
app.get('/contact', (req, res)=> {
  res.render('contact', {
    user: req.session.user
  })
})
app.get('/sign-up', IfLoggedIn, (req, res)=> {
  res.render('sign-up')
})
app.get('/sign-out', (req, res)=> {
  req.session.destroy()
  res.redirect('/')
})

function Video(req, res, next) {
  const query = "SELECT * FROM urlvideo";
  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send("Error fetching data");
    }

    // ส่งข้อมูลทั้งหมดในรูปแบบ array
    res.render('index', {
      videos: results, // ส่ง array ที่มี title, url และ comment
      user: req.session.user // ข้อมูล user
    });
  });
}
app.get('/admin/addvideo', IfAdmin, (req, res) => {
  res.render('admin/addvideo', {
    admin: req.session.admin
  })
})

app.post('/deleteName', (req, res)=> {
  const {
    titleD
  } = req.body
  const deleteName = "DELETE FROM `urlvideo` WHERE title = ?"
  db.query(deleteName, [titleD], (err, result)=> {
    if (err) throw err
    res.redirect('/admin/addvideo')
  })
})
app.post('/deleteAll', (req, res) => {
  const deleteQuery = "DELETE FROM `urlvideo`";
  const resetAutoIncrementQuery = "ALTER TABLE `urlvideo` AUTO_INCREMENT = 1";
  db.query(deleteQuery,
    (err, result) => {
      if (err) throw err;
      db.query(resetAutoIncrementQuery, (err, result) => {
        if (err) throw err;
        res.redirect('/admin/addvideo');
      });
    });
});

app.get('/admin', (req, res) => {
  if (req.session.user) {
    const email = req.session.user.email; // ดึงอีเมลของผู้ใช้งานจาก session
    const checkAdmin = "SELECT * FROM users WHERE email = ? AND role = 'admin'"; // ตรวจสอบเฉพาะผู้ใช้ที่เป็น admin

    db.query(checkAdmin, [email], (err, result) => {
      if (err) {
        console.error("Database query error:", err);
        return res.status(500).send("Internal Server Error");
      }
      const admin = result[0]
      if (result.length > 0) {
        req.session.admin = admin
        res.render('admin/index', {
          admin: req.session.admin
        })
      } else {
        res.redirect('/');
      }
    });
  } else {
    res.redirect('/login');
  }
});

function IfAdmin(req, res, next) {
  if (req.session.admin) {
    next()
  } else {
    res.redirect('/')
  }
}

app.post('/admin/addvideo', IfAdmin, (req, res) => {
  const {
    title, url, comment, Tlink1, Tlink2, Tlink3, link1, link2, link3
  } = req.body
  const insertVideo = "INSERT INTO urlvideo(title,url,comment,link1,link2,link3,Tlink1,Tlink2,Tlink3) VALUES(?,?,?,?,?,?,?,?,?)"
  db.query(insertVideo, [title, url, comment, link1, link2, link3, Tlink1, Tlink2, Tlink3], (err, result)=> {
    if (err) throw err
    res.redirect('/admin/addvideo')
  })
})

app.post('/sign-up', (req, res)=> {
  const {
    name,
    email,
    password,
    ConfirmPassword
  } = req.body
  const checkEmailExists = "SELECT * FROM users WHERE email = ?"
  db.query(checkEmailExists,
    [email],
    (err, result)=> {
      if (err) throw err
      if (result.length > 0) {
        res.render('sign-up', {
          err: 'Email exists.', old_data: req.body
        })
      } else {
        if (password.length < 6) {
          res.render('sign-up', {
            err: 'Password 6+', old_data: req.body
          })
        } else {
          if (password !== ConfirmPassword) {
            res.render('sign-up', {
              err: 'Two pass is not match.', old_data: req.body
            })
          } else {
            const insertUser = "INSERT INTO users(role,name,email,password) VALUES('user',?,?,?)"
            const hashPass = bcrypt.hashSync(password)
            db.query(insertUser, [name, email, hashPass], (err, result)=> {
              res.redirect('/login?success=true');
            })
          }
        }
      }
    })
})

app.post('/login', (req, res)=> {
  const {
    email, password
  } = req.body
  const sql = "SELECT * FROM users WHERE email = ?"
  db.query(sql,
    [email],
    (err, result)=> {
      if (err) throw err
      if (result.length > 0) {
        const user = result[0]
        if (bcrypt.compareSync(password, user.password)) {
          req.session.user = user
          res.redirect('/?success=true')
        } else {
          res.render('login', {
            err: 'Password is not match.', old_data: req.body
          })
        }
      } else {
        res.render('login', {
          err: 'User not found.', old_data: req.body
        })
      }
    })
})

app.use('/', (req, res)=> {
  res.status(404).render('err/404',
    {
      user: req.session.user
    })
})

app.listen(4000, ()=> {
  console.log('server is runningg... 4000')
})