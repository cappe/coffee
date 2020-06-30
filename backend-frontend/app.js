import express from 'express';
import routes from './routes/index.js';
import ejs from 'ejs';
import dbInit from './db-init.js';
import models from './models/index.js';
import net from 'net';
import repl from 'repl';

net.createServer(socket => {
  repl.start("> ", socket);
}).listen(5001, "0.0.0.0", () => {
  console.log('REPL listening on port 5001');
});

process.on('unhandledRejection', (reason, p) => {
  console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
});


const app = express();

// view engine setup
app.set('views', './views');
app.engine('html', ejs.renderFile);
app.set('view engine', 'html');

app.use('/', routes);

/// catch 404 and forwarding to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      title: "Error occured"
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {},
    title: "Ooops..."
  });
});

app.set('port', process.env.PORT || 3000);

(async () => {
  await dbInit();
  await models();

  app.listen(app.get('port'), () => {
    console.log(`HTTP server listening on port ${app.get('port')}`);
  });
})();

export default app;
