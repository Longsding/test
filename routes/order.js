var express = require('express');
var router = express.Router();
var conn = require('./conn');


router.all('*', (req, res, next) => {
    // 先设置响应头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader("Access-Control-Allow-Headers", "authorization"); // 允许携带的请求头
    // 给其他路由放行
    next();
})

/* 获取订单列表 && 带查询功能 */
router.get('/orderlist', (req, res) => {

    let { currentPage, pageSize, orderNo, consignee, phone, orderState, date } = req.query;

    if (!(currentPage && pageSize)) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }

    let sql = `select * from orders where 1 = 1`;

    if (orderNo) {
        sql += ` and orderNo like "%${orderNo}%"`;
    }

    if (consignee) {
        sql += ` and consignee like "%${consignee}%"`
    }

    if (phone) {
        sql += ` and phone like "%${phone}%"`
    }

    if (orderState) {
        sql += ` and orderState = "${orderState}"`
    }

    date = JSON.parse(date)
    if (date.length) {
        sql += ` and orderTime between "${date[0]}" and "${date[1]}"`
    }

    sql += ` order by orderTime desc`;

    let total;
    conn.query(sql, (err, data) => {
        if (err) throw err;
        total = data.length;

        let n = (currentPage - 1) * pageSize;
        sql += ` limit ${n}, ${pageSize}`;

        conn.query(sql, (err, data) => {
            if (err) throw err;
            res.send({
                total,
                data
            })
        })
    })
})


/* 保存修改 */
router.post('/orderedit', (req, res) => {
    let { orderNo, orderTime, phone, consignee, deliverAddress, deliveryTime, remarks, orderAmount, orderState, id } = req.body;

    if (!(orderNo && orderTime && phone && consignee && deliverAddress && deliveryTime && remarks && orderAmount && orderState)) {
        res.send({ code: 5001, msg: "参数错误!" })
        return;
    }

    const sql = `update orders set orderNo="${orderNo}", orderTime="${orderTime}", phone="${phone}", consignee="${consignee}", 
	deliverAddress="${deliverAddress}", deliveryTime="${deliveryTime}", remarks="${remarks}", orderAmount="${orderAmount}", 
	orderState="${orderState}" where id=${id}`;


    conn.query(sql, (err, data) => {
        if (err) throw err;
        if (data.affectedRows > 0) {
            res.send({
                code: 0,
                msg: '修改订单成功!'
            })
        }
    })
})


/* 订单报表统计 */
router.get('/ordertotal', (req, res) => {
    let { date } = req.query;
    date = JSON.parse(date);

    let sql = `select orderTime, orderAmount from orders`

    if (date && date.length) {
        sql += ` where orderTime between '${date[0]}' and '${date[1]}'`;
    }

    sql += ` order by orderTime`;
    conn.query(sql, (err, data) => {
        if (err) throw err;
        res.send({ data })
    })
})


/* 首页报表接口 */
router.get('/indexcharts', (req, res) => {
    res.send({
        date: ["10/01", "10/02", "10/03", "10/04", "10/05", "10/06", "10/07"],
        data: {
            orderNum: [30, 13, 12, 25, 18, 30, 21],
            amount: [100, 203, 112, 151, 108, 200, 210]
        }
    })
})




module.exports = router;