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
	destination: 'public/upload/goods',
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


// 商品上传
router.post('/upload', upload.single('file'), (req, res) => {

	console.log(req.file)

	let { filename } = req.file;
	res.send({ code: 0, msg: "上传成功!", imgUrl: filename })

	// 把之前上传的图片删除
	// 	fs.readdir('./public/upload/goods', (err, files) => {
	// 		if (err) throw err;
	// 		console.log('读取结果:', files)
	// 		files.forEach(v => {
	// 			if (v !== filename) {
	// 				let path = './public/upload/goods/' + v;
	// 				fs.unlinkSync(path);
	// 			}
	// 		})
	// 	})
})


/* 添加商品 */
router.post('/goodsadd', (req, res) => {
	let { goodsname, goodscategory, goodsfeature, imgUrl, isPromotion, standard, goodsdesc } = req.body;


	if (!(goodsname && goodscategory && goodsfeature && imgUrl && isPromotion && standard && goodsdesc)) {
		res.send({ code: 5001, msg: "参数错误!" })
		return;
	}

	const sql = `insert into goods(goodsname, goodscategory, goodsfeature, imgUrl, isPromotion, standard, 
	goodsdesc) values("${goodsname}", "${goodscategory}", '${goodsfeature}', "${imgUrl}", "${isPromotion}", '${standard}', "${goodsdesc}")`;

	console.log("sql:", sql)
	conn.query(sql, (err, data) => {
		if (err) throw err;
		if (data.affectedRows > 0) {
			res.send({ code: 0, msg: '添加商品成功!' })
		} else {
			res.send({ code: 1, msg: '添加商品失败!' })
		}
	})
})

/* 获取商品列表 */
router.get('/goodslist', (req, res) => {
	let { currentPage, pageSize } = req.query;

	if (!(currentPage && pageSize)) {
		res.send({ code: 5001, msg: "参数错误!" })
		return;
	}

	let sql = `select * from goods`;
	let total;

	conn.query(sql, (err, data) => {
		if (err) throw err;
		total = data.length;

		let n = (currentPage - 1) * pageSize;
		sql += ` order by ctime desc limit ${n}, ${pageSize}`;

		conn.query(sql, (err, data) => {
			if (err) throw err;
			res.send({
				total,
				data
			})
		})
	})
})

// 删除商品
router.get('/goodsdel', (req, res) => {
	let { id } = req.query;

	if (!id) {
		res.send({ code: 5001, msg: "参数错误!" })
		return;
	}

	const sql = `delete from goods where id = ${id}`;
	conn.query(sql, (err, data) => {
		if (err) throw err;
		if (data.affectedRows > 0) {
			res.send({ code: 0, msg: '删除成功!' })
		}
	})
})

// 修改商品
router.post('/goodsedit', (req, res) => {
	let { id, goodsname, goodscategory, goodsfeature, imgUrl, isPromotion, standard, goodsdesc } = req.body;

	if (!(id && goodsname && goodscategory && goodsfeature && imgUrl && isPromotion && standard && goodsdesc)) {
		res.send({ code: 5001, msg: "参数错误!" })
		return;
	}

	const sql = `update goods set goodsname="${goodsname}", goodscategory="${goodscategory}", goodsfeature='${goodsfeature}',
	 imgUrl="${imgUrl}", isPromotion="${isPromotion}", standard='${standard}', goodsdesc="${goodsdesc}" where id=${id}`;

	console.log(sql)

	conn.query(sql, (err, data) => {
		if (err) throw err;
		if (data.affectedRows > 0) {
			res.send({ code: 0, msg: '修改商品成功!' })
		} else {
			res.send({ code: 1, msg: '修改商品失败!' })
		}
	})

})

module.exports = router;
