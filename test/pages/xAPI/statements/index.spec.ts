import sinon from 'sinon';
import http from 'http';
import supertest from 'supertest';
import proxyquire from 'proxyquire';
import { apiResolver } from 'next/dist/server/api-utils';
import fixtures from  '../../../fixtures.json';
const sandbox = sinon.createSandbox();
const {
  singleStatement,
  statementCollection,
  illegalStatementCollection
} = fixtures;
let handler;
let mongoStub;
let mongoMock;
let findRes;
beforeEach(() => {
  mongoMock = {
    connect: sandbox.stub(),
    db: sandbox.stub().resolves(mongoStub),
    collection: sandbox.stub().resolves(mongoStub),
    find: sandbox.stub().resolves(mongoStub),
    sort: sandbox.stub().resolves(findRes),
    insertOne: sandbox.stub().resolves(),
    insertMany: sandbox.stub().resolves()
  }
  mongoStub = () => {
    return mongoMock;
  };
  handler = proxyquire('../../../../pages/xAPI/statements/index', {
    'mongodb': {
      MongoClient: sinon.stub().callsFake(() => { return mongoMock }),
      '@NoCallThru': true,
    }
  })
});

afterEach(() => {
  sandbox.restore();
})

describe('[SETUP] /pages/xAPI/statements', () => {
  let server;
  let usr;
  let pw;
  beforeEach(()=> {
    const requestHandler = (request, response) =>
      apiResolver(
        request,
        response,
        undefined,
        handler
      );
    server = http.createServer(requestHandler);
  });

  afterEach(() => {
    server.close();
    sandbox.restore();
  });
  it('successfully mocks the mongo client', (done) => {
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .then((response) => {
        mongoMock.connect.should.have.been.calledOnce;
        done();
      }).catch((err) => {
        done(err);
      });
  });

});

describe ('[POST] /pages/xAPI/statements', () => {
  let server;
  let usr;
  let pw;
  beforeEach(()=> {
    const requestHandler = (request, response) =>
      apiResolver(
        request,
        response,
        undefined,
        handler
      );
    server = http.createServer(requestHandler);
  });

  afterEach(() => {
    server.close();
    sandbox.restore();
  });

  it('returns 404 on requests without authorization', (done) => {
    const body = {
      statements: statementCollection.statements
    };
    supertest(server)
      .post('/')
      .send(body)
      .expect(404)
      .expect('Content-Type', 'application/json')
      .then((response) => {
        done();
      })
      .catch((err) => {
        done(err)
      })
  });

  it('returns 200 ok and the array of statements', (done) => {
    const body = {
      statements: statementCollection.statements
    };

    supertest(server)
      .post('/')
      .auth(usr, pw)
      .send(body)
      .expect('Content-Type', 'application/json')
      .expect(200)
      .then((response) => {
        response.should.not.equal(undefined);
        done();
      })
      .catch((err) => {
        done(err)
      })
  });

  it('returns 204 No Content when given an existing Statement', (done) => {
    //TODO: COPY MONGO ERROR MESSAGE
    mongoMock.insertOne.rejects("statement already exists");
    const body = {
      statements: [singleStatement.statement]
    };
    supertest(server)
      .post('/')
      .auth(usr, pw)
      .send(body)
      .expect('Content-Type', 'application/json')
      .expect(204)
      .then((response) => {
        done();
      })
      .catch((err) => {
        done(err)
      })
  });

  it('returns 409 Conflict when given a conflicting statement', (done) => {
    //TODO: COPY MONGO ERROR MESSAGE
    mongoMock.insertOne.rejects("statementConflict");
    const body = {
      statements: [singleStatement.statement]
    };
    supertest(server)
      .post('/')
      .auth(usr, pw)
      .send(body)
      .expect('Content-Type', 'application/json')
      .expect(409)
      .then((response) => {
        response.body.should.deepEqual(singleStatement.id);
        done();
      })
      .catch((err) => {
        done(err)
      })
  });

  it('returns 400 if not all statement ids are unique', (done) => {
    //TODO: COPY MONGO ERROR MESSAGE
    mongoMock.insertMany.rejects('not all statements are unique');
    const body = {
      statements: illegalStatementCollection
    };

    supertest(server)
      .post('/')
      .auth(usr, pw)
      .send(body)
      .expect('Content-Type', 'application/json')
      .expect(400)
      .then((response) => {
        done();
      })
      .catch((err) => {
        done(err)
      })
  });
});

describe('[GET] /pages/api/statements', () => {
  let server;
  let usr;
  let pw;
  beforeEach(()=> {
    const requestHandler = (request, response) =>
      apiResolver(
        request,
        response,
        undefined,
        handler
      );
    server = http.createServer(requestHandler);
  });

  afterEach(() => {
    server.close();
    sandbox.restore();
  });
  it('returns 200 and a list of statements', (done) => {
    findRes = statementList.statements;
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        response.should.deep.equal({
          statements: statementList.statements,
          more: ''
        });
        done();
      })
      .catch((err) => {
        done(err)
      });
});

  it('returns 200 and an empty statement array', (done) => {
    mongoMock.sort.resolves({statements:[], more: ''});
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .expect('Content-Type', /json/)
      .expect(200)
      .then((response) => {
        response.statements.length.should.equal(0);
        done();
      }).catch((err) => {
        done(err);
      })
  })

  it('returns 400 when statementId and voidedStatementId are specified', (done) => {
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .query({statementId: 'statement', voidedStatementId: 'voided'})
      .expect(400, done)
      .catch((err) => {
        done(err);
      })
  });

  it('returns 400 when (voided) statemenId is passed with illegal params', (done) => {
      supertest(server)
        .get('/')
        .auth(usr, pw)
        .query({statementId: 'statement', verb: 'adlnet.gov/expapi/interacted'})
        .expect(400, done)
        .catch((err) => {
          done(err);
        })
  });

  it('returns 404 on requests without authorization', (done) => {
    supertest(server)
      .get('/')
      .expect(404, done)
      .catch((err) => {
        done(err);
      })
  });

  it('includes the X-Experience-API-Consistent-Through header', (done) => {
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .expect(200)
      .expect(
        'X-Experience-API-Consistent-Through',
        new Date(Date.now()).toISOString(),
        done
      ).catch((err) => {
        done(err);
      })
  });

  it('uses multipart response format when returning attachments', (done) => {
    //TODO: implement test of multipart format
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .query({attachments: true})
      .expect('Content-Type', 'multipart/mixed', done)
      .catch((err) => {
        done(err);
      });
  });

  it('uses application/json when not returning attachments', (done) => {
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .query({attachments: false})
      .expect('Content-Type', /json/, done)
      .catch((err) => {
        done(err);
      });
  });

  it('returns a "Last-Modified" header', (done) => {
    //TODO: have Mongo return statement with proper LastMod
    let lastMod = new Date(Date.now()).toISOString();
    supertest(server)
      .get('/')
      .auth(usr, pw)
      .expect('Last-Modified', lastMod);
  });
});

describe ('[PUT] /pages/api/statements', () => {
  let server;
  let usr;
  let pw;
  beforeEach(()=> {
    const requestHandler = (request, response) =>
      apiResolver(
        request,
        response,
        undefined,
        handler
      );
    server = http.createServer(requestHandler);
  });

  afterEach(() => {
    server.close();
    sandbox.restore();
  });

  it('returns 404 on requests without authorization', (done) => {
    supertest(server)
      .put('/')
      .send(singleStatement.statement)
      .expect(404, done)
      .catch((err) => {
        done(err);
      })
  });

  it('returns 400 when attempting to PUT multiple statements', (done) => {
      //TODO: attach multiple statements
      supertest(server)
        .put('/')
        .auth(usr, pw)
        .send(statementCollection.statements)
        .expect(400, done)
        .catch((err) => {
          done(err);
        })
  });

  it('returns 409 when attempting to PUT a conflicting statement', (done) => {
    supertest(server)
      .put('/')
      .auth(usr, pw)
      .send(singleStatement.conflict)
      .expect(409, done)
      .catch((err) => {
        done(err);
      });
  });

  it('returns 201 on a successful PUT', (done) => {
    supertest(server)
      .put('/')
      .auth(usr, pw)
      .send(singleStatement.statement)
      .expect(201, done)
      .catch((err) => {
        done(err);
      });
  });
});

describe ('[HEAD] /pages/api/statements', () => {
  it('returns 201 and the metadata for the statement', () => {

  });

  it('returns 201 and the metadata for the statements', () => {

  })

  it('returns 404 on requests without authorization', () => {

  });

  it('returns 400 on ', async ()=> {

  })
});
