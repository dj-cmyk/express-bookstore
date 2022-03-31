process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../app');
const db = require('../db');

let testBook;
beforeEach(async () => {
  const result = await db.query(`
    INSERT INTO books (isbn, amazon_url, author, language, pages, publisher, title, year) 
    VALUES (
        '0691161518', 
        'http://a.co/eobPtX2', 
        'Matthew Lane', 
        'english', 
        264, 
        'Princeton University Press', 
        'Power-Up: Unlocking the Hidden Mathematics in Video Games', 
        2017)
    RETURNING isbn, amazon_url, author, language, pages, publisher, title, year`);
  testBook = result.rows[0]
})

afterEach(async () => {
  await db.query(`DELETE FROM books`)
})

afterAll(async () => {
  await db.end()
})

describe("GET /books", () => {
  test("Get a list of all books", async () => {
    const res = await request(app).get('/books')
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ books: [testBook] })
  })
})

describe("GET /books/:id", () => {
  test("Gets a single book", async () => {
    const res = await request(app).get(`/books/${testBook.isbn}`)
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ book: testBook })
  })
  test("Responds with 404 for invalid id", async () => {
    const res = await request(app).get(`/books/anything`)
    expect(res.statusCode).toBe(404);
  })
})

describe("POST /books", () => {
  test("Creates a single book", async () => {
    const res = await request(app).post('/books').send(
        { 
        "isbn": "0001112222",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Test Author",
        "language": "english",
        "pages": 500,
        "publisher": "Test Publisher",
        "title": "Test Book for Testing",
        "year": 2022
        });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      book: {
        "isbn": "0001112222",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Test Author",
        "language": "english",
        "pages": 500,
        "publisher": "Test Publisher",
        "title": "Test Book for Testing",
        "year": 2022
        }
    })
  })
  test("Sending invalid data to create book", async () => {
    const res = await request(app).post('/books').send(
        { 
        "isbn": "0001112222",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Test Author",
        "language": "english",
        "pages": "500",
        "publisher": "Test Publisher",
        "title": "Test Book for Testing",
        "year": "2022"
        });
    expect(res.statusCode).toBe(400);
  })
  test("Sending missing data to create book", async () => {
    const res = await request(app).post('/books').send(
        { 
        "isbn": "0001112222",
        "publisher": "Test Publisher",
        "title": "Test Book for Testing",
        "year": "2022"
        });
    expect(res.statusCode).toBe(400);
  })
})

describe("PUT /books/:isbn", () => {
  test("Updates a single book", async () => {
    const res = await request(app).put(`/books/${testBook.isbn}`).send({
        "isbn": "0691161518",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Updated Author",
        "language": "english",
        "pages": 264,
        "publisher": "Updated Publisher",
        "title": "Updated Title",
        "year": 2017
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      book: {
        "isbn": testBook.isbn,
        "amazon_url": testBook.amazon_url,
        "author": "Updated Author",
        "language": testBook.language,
        "pages": testBook.pages,
        "publisher": "Updated Publisher",
        "title": "Updated Title",
        "year": testBook.year
      }
    })
  })
  test("Responds with 404 for invalid isbn", async () => {
    const res = await request(app).put(`/books/anything`).send({
        "isbn": "0691161518",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Matthew Lane",
        "language": "english",
        "pages": 264,
        "publisher": "Princeton University Press",
        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
        "year": 2017
      });
    expect(res.statusCode).toBe(404);
  })
  test("Responds with 400 for missing data", async () => {
    const res = await request(app).put(`/books/${testBook.isbn}`).send({
        "isbn": "0691161518",
        "amazon_url": "http://a.co/eobPtX2",
        "publisher": "Princeton University Press",
        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
        "year": 2017
      });
    expect(res.statusCode).toBe(400);
  })
  test("Responds with 400 for invalid data", async () => {
    const res = await request(app).put(`/books/${testBook.isbn}`).send({
        "isbn": "0691161518",
        "amazon_url": "http://a.co/eobPtX2",
        "author": "Matthew Lane",
        "language": true,
        "pages": "264",
        "publisher": 1509304098,
        "title": "Power-Up: Unlocking the Hidden Mathematics in Video Games",
        "year": 2050
      });
    expect(res.statusCode).toBe(400);
  })
})

describe("DELETE /books/:isbn", () => {
  test("Deletes a single book", async () => {
    const res = await request(app).delete(`/books/${testBook.isbn}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ message: "Book deleted" })
  })
  test("Responds with 404 for invalid code", async () => {
    const res = await request(app).delete(`/books/000000000`);
    expect(res.statusCode).toBe(404);
  })
})