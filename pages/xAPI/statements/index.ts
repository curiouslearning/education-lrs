import { MongoClient } from 'mongodb'
import type { NextFetchEvent, NextRequest } from 'next/server'
import Cors from 'cors'
import {
  Next,
  sanitizeQueryParams,
  validateQueryParams,
} from '../../_middleware.ts'

const uri: string = process.env.MONGODB_URI

const options = {
  useUnifiedTopology: true,
  useNewUrlParser: true,
  connectTimeoutMS: 7000,
}
enum FormatTypes = {ids="ids", exact="exact", canonical="canonical"}
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
  res: NextFetchEvent,
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
async function handleGET(req: NextRequest, res: NextFetchEvent): void {
  const client = new MongoClient(uri, options);
  try {
    // await runMiddleware(req, res, sanitizeQueryParams);
    // await runMiddleware(req, res, validateQueryParams);
    // await runMiddleware(req, res, cors);
    await client.connect();

    const rows = await client.db("assessment").collection("statements").find({}).sort(-1);
    res.status(200).json({
      statements: rows,
      more: ''
    })
  } catch (err) {
    return res.status(400).send('fuck');
  }
}

async function handleHEAD(req: NextRequest, res: NextFetchEvent): void {

}

/************************************POST, PUT ********************************/
async function addSingleStatement(
  req: NextRequest,
  res: NextFetchEvent,
  next: Next
): void {

}

async function addMultipleStatements(
  req: NextRequest,
  res: NextFetchEvent,
  next: Next
): void {

}

async function handlePOST(req: NextRequest,res: NextFetchEvent): void {
  return res.status(400).send('fuck');
}

async function handler (req: NextRequest, res: NextFetchEvent): void {

  switch(req.method) {
    case 'POST':
      return handlePOST(req, res);
    case 'GET':
      return handleGET(req, res);
    case 'HEAD':
      break;
    case 'PUT':
      return handlePOST(req, res);
    case 'DELETE':
      break;
    case 'PUT':
      break;
    case 'UPDATE':
      break;
    default:
      res.status(400).send('unrecognized request method!');
      return;
  }

}

export default handler
