let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let indexRouter = require('./routes/index');

const groupEventsRouter = require('./routes/groupEvents');
const groupMembersRouter = require('./routes/groupMembers');
const expensesRouter = require('./routes/expenses');
const transactionsRouter = require('./routes/transactions');

let app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter); // TODO ?

app.all('/groupEvents/:groupEventId/*', groupEventsRouter.verifyExists); // TODO :..*?

app.get('/groupEvents', groupEventsRouter.getAll); // TODO remove this route?
app.get('/groupEvents/:id', groupEventsRouter.getOne);
app.post('/groupEvents', groupEventsRouter.addGroupEvent);
app.put('/groupEvents/:id', groupEventsRouter.editGroupEvent);
app.delete('/groupEvents/:id', groupEventsRouter.deleteGroupEvent);

app.get('/groupEvents/:groupEventId/members', groupMembersRouter.getAll);
app.get('/groupEvents/:groupEventId/members/:id', groupMembersRouter.getOne);
app.post('/groupEvents/:groupEventId/members', groupMembersRouter.addGroupMember);
app.put('/groupEvents/:groupEventId/members/:id', groupMembersRouter.editGroupMember);
app.delete('/groupEvents/:groupEventId/members/:id', groupMembersRouter.deleteGroupMember);

app.get('/groupEvents/:groupEventId/expenses', expensesRouter.getAllReferenced);
app.get('/groupEvents/:groupEventId/expenses-detailed', expensesRouter.getAllNested);
app.get('/groupEvents/:groupEventId/expenses/:id', expensesRouter.getOneReferenced);
app.get('/groupEvents/:groupEventId/expenses-detailed/:id', expensesRouter.getOneNested);
app.post('/groupEvents/:groupEventId/expenses', expensesRouter.addExpense);
app.put('/groupEvents/:groupEventId/expenses/:id', expensesRouter.editExpense);
app.delete('/groupEvents/:groupEventId/expenses/:id', expensesRouter.deleteExpense);

app.get('/groupEvents/:groupEventId/transactions', transactionsRouter.getAll);

// TODO add more routes

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;