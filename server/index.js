const express = require('express');
const userRouter = require('./Routers/UserRouter');

app = express();

app.get('/', (req, res) => {
  res.send({someobject: "yeah"});
});

app.use('/user', userRouter);

app.listen(9888);
