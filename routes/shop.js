var express = require('express');
var router = express.Router();
var multer = require('multer');

var conn = require('./conn')

router.all('*', (req, res, next) => {
  // 先设置响应头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader("Access-Control-Allow-Headers", "authorization"); // 允许携带的请求头
  // 给其他路由放行
  next();
})

var storage = multer.diskStorage({
    destination: 'public/upload/shop', // 
    filename: function (req, file, cb) {
        // 处理文件格式
        var fileFormat =(file.originalname).split(".");  

        // 获取当前时间戳 用于重命名 
        var filename = new Date().getTime();  
        cb(null, filename + "." + fileFormat[fileFormat.length - 1]); // 拼接文件名
    }
});

// 上传对象
var upload = multer({
    storage
});


// 店铺上传
router.post('/upload', upload.single('file'), (req, res) => {
	let { filename } = req.file;
	res.send({ code: 0, msg:"上传成功!", imgUrl: filename })
})


/* 获取店铺数据 */
router.get('/shopinfo', (req, res) => {
	const sql = `select * from shop`;
	conn.query(sql, (err, data) => {
		if (err) throw err;
		res.send({ data: data[0] })
	})
})

/* 保存修改 */
router.post('/shopedit', (req, res) => {
	let {shopname, address, phone, shopdesc, slogan, category, feature, packingexpense, minprice, date, shopAvatar, businessLicenseImg, cateringServiceLicenseImg, tableData} = req.body;

	if ( !(shopname && address && phone && shopdesc && slogan && category && feature && packingexpense && minprice && date && shopAvatar && businessLicenseImg && cateringServiceLicenseImg && tableData) ) {
		res.send({code: 5001, msg: "参数错误!"})
		return;
	}

	const sql = `update shop set shopname="${shopname}", address="${address}", phone="${phone}", shopdesc="${shopdesc}", slogan="${slogan}", 
	category="${category}", feature='${feature}', packingexpense="${packingexpense}",
	 minprice=${minprice}, date='${date}', shopAvatar="${shopAvatar}", businessLicenseImg="${businessLicenseImg}",
	  cateringServiceLicenseImg="${cateringServiceLicenseImg}", tableData='${tableData}' where id = 1`;

	console.log(sql)

	conn.query(sql, (err, data) => {
		if (err) throw err;
		if (data.affectedRows > 0) {
			res.send({code: 0, msg: '修改店铺信息成功!'})
		} else {
			res.send({code: 1, msg: '修改店铺信息失败!'})
		}
	})
})



module.exports = router;
