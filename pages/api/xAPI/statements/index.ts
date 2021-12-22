import { MongoClient } from 'mongodb'
import type { NextFetchEvent, NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto';
import Cors from 'cors';
import deepEqual from 'deep-equal';
import { apiHandler } from '../../helpers/api/api-handler';
import  middleware from '../../helpers/api/request-sanitizers';
import { Next } from  '../../helpers/api/request-sanitizers';
const helpers = middleware();

const uri: string = process.env.MONGODB_URI

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  connectTimeoutMS: 7000,
}
enum FormatTypes {ids="ids", exact="exact", canonical="canonical"}
type QueryParams = {
  statementId?: string;
  voidedStatmentId?: string;
  agent: {
    objectType?: "Agent";
    name?: string;
    account: {
      homepage: string;
      name: string;
    }
  };
  activit: string;
  registration: string;
  related_activities: bool;
  related_agents: bool;
  since: timestamp;
  until: Timestamp;
  limit: number;
  format: FormatTypes;
  attachments: bool;
  ascending: bool;
};

/********************************HELPER MIDDLEWARE*****************************/
const cors = Cors({
  methods: ['GET', 'HEAD']
});

async function runMiddleware(
  req: NextRequest,
  res: NextResponse,
  fn: Next
): void {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if( result instanceof Error) {
        return reject(result)
      }

      return resolve(result);
    })
  })
}

/******************************GET, HEAD***************************************/
async function handleGET(req: NextRequest, res: NextResponse): void {
  const client = new MongoClient(uri, options);
  try {
    // await runMiddleware(req, res, sanitizeQueryParams);
    // await runMiddleware(req, res, validateQueryParams);
    // await runMiddleware(req, res, cors);
    await client.connect();
    const queryOptions = generateQueryParams(req.query);
    const rows = await client
      .db("xAPI")
      .collection("statements")
      .find(queryOptions.params)
      .sort(queryOptions.sort)
      .toArray();
    rows.forEach((row) => {
      delete row['_id']; //_id is a mongoDB parameter outside the scope of xAPI
    });
    res.status(200).json({
      statements: rows,
      more: ''
    })
  } catch (err) {
    throw err;
  } finally{
    client.close();
  }
}

function generateQueryParams(query: QueryParams = {}): any {
  let options = {};
  let params = {};
  if(query) {
    if(query.voidedStatmentId) {
      params['_id'] = query.voidedStatmentId;
    } else if (query.statementId) {
      params['_id'] = query.statementId;
    }

    if(query.agent) {
      params['actor'] = query.agent;
      params['object'] = query.agent;
    }
    if(query.verb) {
      params['verb'] = query.verb;
    }
    if(query.activity) {
      params['object']['id'] = query.activity;
    }
    if(query.registration) {
      params['context']['registration'] = query.registration;
    }
    //TODO: implement these related flags as described in the specification
    // github.com/adlnet/xAPI-Spec/blob/master/xAPI-Communication.md#213-get-statements
    if(query.related_activities) {
      params['object']['id'] = query.activity;
    }
    if(query.related_agents) {
      params['actor'] = query.activity;
    }

    if((query.since && query.until) && (query.since < query.until)) {
      params['timestamp'] = {or: [{$gte: query.since}, {$lte: query.until}]}
    } else if(query.since) {
      params['timestamp'] = {$gte: query.since}
    } else if(query.until) {
      param['timestamp'] = {$lte: query.since}
    }
  }
  options['limit'] = query.limit? query.limit : 0;
  options['format'] = query.format? query.format : 'exact';

  options['attachments'] = query.attachments? query.attachments : false;
  options['sort'] = {
    stored: query.ascending? 1 : -1
  };
  options['params'] = params;
  return options;
}

async function handleHEAD(req: NextRequest, res: NextResponse): void {
  return res.status(500).send("I'm not implemented yet!");
}

/************************************POST, PUT ********************************/
async function addSingleStatement(
  req: NextRequest,
  res: NextResponse,
  next: Next
): void {

}

async function addMultipleStatements(
  req: NextRequest,
  res: NextResponse,
): void {

}

async function handlePOST(
  req: NextRequest,
  res: NextResponse
): void {
  const client = new MongoClient(uri, options);
  if(!req.body)
  {
    res.status(200).end();
  }
  try {
    await client.connect();
    helpers.sanitizeBody(req, res, (err)=> {throw err;});
    let body = req.body.data
    body.forEach((statement) => {
      statement['stored'] = new Date(Date.now()).toISOString();
      if (!statement.timestamp){
        statement['timestamp'] = statement.stored;
      }
    });
    body = helpers.createStatementID(body, res, (err) => {throw err;})
    req.body.data = body;
    const ids = body.map(statement => statement.id);
    let result;
    if(body.length > 1) {
      result = await client
        .db("xAPI")
        .collection("statements")
        .insertMany(body);
    } else {
      result = await client
        .db("xAPI")
        .collection("statements")
        .insertOne(body[0]);
    }
    if(!result.acknowledged || !result.insertedId) {
      throw "failed to record statement";
    }
    res.status(200).send(ids);
  } catch(err) {
    if(err.name === 'MongoServerError') {
      if(err.code === 11000) {
        return runDupeCheck(req, res, err);
      }
    }
    throw err;
  } finally {
    client.close();
  }
}
async function runDupeCheck(req, res, err) {
    const dupeCheck = new MongoClient(uri, options);
    await dupeCheck.connect();
    const original = await dupeCheck.db('xAPI')
      .collection('statements')
      .find(err.keyValue)
      .toArray();
    dupeCheck.close();
   const conflict = req.body.data.find(element => element._id === err.keyValue._id);
   delete original[0]['stored'];
   delete conflict['stored'];
   if(deepEqual(original[0], conflict)) {
     return res.status(204).end();
   } else {
     return (res
       .status(409)
       .send(`a conflicting statement with id ${conflict._id} already exists in the database`));
   }
}
async function handlePUT(
  req: NextRequest,
  res: NextResponse,
): void {
  return res.status(500).send("I'm not implemented yet!");
}


export default apiHandler({
  get: handleGET,
  post: handlePOST,
  put: handlePUT,
  head: handleHEAD
});
