# TinyApp Project

TinyApp is a full stack web application built with Node and Express that allows users to shorten long URLs (à la bit.ly).

## Final Product

!["screenshot of the login page"](https://github.com/ruowent/tinyapp/blob/main/docs/login-page.png)
!["screenshot of the register page"](https://github.com/ruowent/tinyapp/blob/main/docs/registration-page.png)

## Dependencies

- Node.js
- Express
- EJS
- bcrypt
- body-parser
- cookie-session
- nodemon

## Getting Started

- Install all dependencies (using the `npm install` command).
- Run the development web server using the `npm start` command.

## Functionality

#### `GET /`

- if user is logged in:
(Minor) redirect to /urls
- if user is not logged in:
(Minor) redirect to /login

#### `GET /urls`

- if user is logged in:
returns HTML with:
the site header (see Display Requirements above)
