const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const axios = require('axios');
const fs = require('fs');
const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.get('/download-file', function(req, res) {
  const filePath = path.join(__dirname, 'countries.php');
  res.download(filePath, 'countries.php', function(err) {
    if (err) {
      console.error(err);
      res.render('error', { error: err });
    } else {
      console.log('File downloaded with success!');
    }
  });
});

app.get('/generate-file', async (req, res, next) => {
  try {
    // Appel à l'API RestCountries pour obtenir les données des pays
    const response = await axios.get('https://restcountries.com/v3.1/all');
    const countries = response.data;
    const countriesText = Object.values(countries).map((country) => {
      return `"${country.cca2}" => "${country.name.common}"`;
    });

    const fileContent = `<?php\n\n$countries = [\n  ${countriesText.join(',\n  ')}\n];`;

    fs.writeFile('countries.php', fileContent, (err) => {
      if (err) {
        console.error(err);
        res.render('error', { error: err });
      } else {
        console.log('fille create with success!');
        const countriesFormatted = Object.values(countries).map((country) => ({
          code: country.cca2,
          name: country.name.common,
        }));
        res.render('countries', { countries: countriesFormatted });
      }
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
});

app.use(function(req, res, next) {
  next(createError(404));
});
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
