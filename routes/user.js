var express = require('express');
var router = express.Router();
var conn = require('./conn');
var multer = require('multer');

const jwt = require('jsonwebtoken');
// expressJwt 用于验证token的有效性
const expressJwt = require('express-jwt');
// 秘钥
const secretKey = 'itsource';


// 使用中间件验证token合法性
router.use(expressJwt({
    secret: secretKey
}).unless({
    path: ['/user/checklogin', '/user/upload']  // 不需要验证token的地址
}))

// 拦截器
router.use(function (err, req, res, next) {
    // 如果用户的请求 没有携带token 那么错误类型是 UnauthorizedError
    if (err.name === 'UnauthorizedError') {
        // 如果前端请求不带token 返回错误
        res.status(401).send('无效的token...');
    }
})

// 统一处理跨域问题
router.all('*', (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "authorization"); // 允许携带的请求头
    next()
})

// 添加用户
router.post('/useradd', (req, res) => {

    let { username, password, usergroup } = req.body;
    if (!(username && password && usergroup)) {
        res.send({ code: 5001, msg: "参数错误，注意你的请求参数哟!" })
        return
    }

    const sql = `insert into users(account, password, userGroup, imgUrl) values("${username}", "${password}", "${usergroup}", "default.jpg")`;

    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: "添加账号成功,哈哈!" })
        } else {
            res.send({ code: 1, msg: "添加账号失败,呵呵!" })
        }
    })


})

// 查询用户列表
router.get('/userlist', (req, res) => {
    let { currentPage, pageSize } = req.query;

    if (!(currentPage && pageSize)) {
        res.send({ code: 5001, msg: "参数错误，注意你的请求参数哟!" })
        return
    }

    let total;
    // 准备sql
    let sql = `select * from users order by ctime desc`;
    conn.query(sql, (err, data) => {
        if (err) throw err;

        total = data.length;
        console.log(data);
        console.log(total);

        sql += ` limit ${(currentPage - 1) * pageSize},${pageSize}`

        conn.query(sql, (err, data) => {

            console.log(sql);

            if (err) throw err;
            res.send({ total, data })
        })
    })

})

// 删除用户
router.get('/deluser', (req, res) => {
    let { id } = req.query;
    if (!id) {
        res.send({ code: 5001, msg: "参数错误，注意你的请求参数哟!" })
        return
    }

    const sql = `delete from users where id = ${id};`

    conn.query(sql, (err, data) => {
        if (err) throw err;

        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: "删除账号成功,哈哈!" })
        } else {
            res.send({ code: 1, msg: "删除账号失败,呵呵!" })
        }

    })



})

// 批量删除用户
router.get('/delbacthuser', (req, res) => {

    let { ids } = req.query;

    ids = JSON.parse(ids)
    if (!ids.length) {
        res.send({ code: 5001, msg: "参数错误，注意你的请求参数哟!" })
        return
    }

    const sql = `delete from users where id in (${ids.join(',')})`
    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: "删除账号成功,哈哈!" })
        } else {
            res.send({ code: 1, msg: "删除账号失败,呵呵!" })
        }
    })
})

// 修改用户信息
router.post('/usereidt', (req, res) => {

    let { id, username, usergroup } = req.body;

    if (!(id && username && usergroup)) {
        res.send({ code: 5001, msg: "参数错误，注意你的请求参数哟!" })
        return
    }

    const sql = `UPDATE users set account="${username}" , userGroup = "${usergroup}" where id = ${id}`

    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: "修改信息成功,哈哈!" })
        } else {
            res.send({ code: 1, msg: "修改信息失败,呵呵!" })
        }
    })



})

/* 检查用户身份 */
router.post('/checklogin', (req, res) => {
    let { account, password } = req.body;

    if (!(account && password)) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }

    const sql = `select * from users where account="${account}" and password="${password}"`;

    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.length) {


            /*------------------------------------------*/
            // 取出用户信息
            const userInfo = { ...data[0] };
            //生成token
            const token = jwt.sign(userInfo, secretKey, {
                expiresIn: 60 * 60 * 2 // token过期时间
            })
            /*------------------------------------------*/

            let role = data[0].userGroup === '超级管理员' ? 'super' : 'jennery';

            res.send({ code: 0, msg: '欢迎你，登录成功', token, role })
        } else {
            res.send({ code: 1, msg: '登录失败，请检查用户名或密码' })
        }
    })
})

/* 验证旧密码是否正确 */
router.get('/checkoldpwd', (req, res) => {
    console.log(req.user);

    let { oldPwd } = req.query;

    console.log(oldPwd);
    if (!oldPwd) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }
    console.log(req.user.password);

    if (oldPwd === req.user.password) {
        res.send({ code: '00', msg: '旧密码正确' })
    } else {
        res.send({ code: "11", msg: '原密码错误' })
    }
})

/* 修改密码 */
router.post('/passwordedit', (req, res) => {
    let { newPwd } = req.body;

    console.log(newPwd);

    if (!newPwd) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }

    const sql = `update users set password="${newPwd}" where id=${req.user.id}`;
    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: '修改密码成功，请重新登录!' })
        } else {
            res.send({ code: 1, msg: '修改密码失败!' })
        }
    })
})


/* 个人中心 */
router.get('/accountinfo', (req, res) => {

    const sql = `select * from users where id=${req.user.id}`;
    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.length) {
            res.send({ accountInfo: data[0] })
        }
    })
})

/* 修改用户头像 */
router.get('/avataredit', (req, res) => {
    let { imgUrl } = req.query;

    if (!imgUrl) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }

    const sql = `update users set imgUrl="${imgUrl}" where id=${req.user.id}`;

    console.log(sql)
    conn.query(sql, (err, data) => {
        if (err) throw err;

        if (data.affectedRows > 0) {
            res.send({ code: 0, msg: '修改头像成功!' })
        } else {
            res.send({ code: 1, msg: '修改头像失败!' })
        }
    })
})

var storage = multer.diskStorage({
    destination: 'public/upload/account', // 
    filename: function (req, file, cb) {
        // 处理文件格式
        var fileFormat = (file.originalname).split(".");

        // 获取当前时间戳 用于重命名 
        var filename = new Date().getTime();
        cb(null, filename + "." + fileFormat[fileFormat.length - 1]); // 拼接文件名
    }
});

// 上传对象
var upload = multer({
    storage
});

// 头像上传
router.post('/upload', upload.single('file'), (req, res) => {
    let { filename } = req.file;
    res.send({ code: 0, msg: "上传成功!", imgUrl: filename })
})

module.exports = router;