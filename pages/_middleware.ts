import type { NextFetchEvent, NextRequest } from 'next/server'

export default function middleware () {

   type Next = () => void | Promise<void>;


  async function sanitizeQueryParams (
    req: NextRequest,
    res: NextFetchEvent,
    next: Next
  ): void {

  }

  async function validateQueryParams (req: NextRequest,
    res: NextFetchEvent,
    next:Next
  ): void {
    try {
      const query = req.query
      if(query.statementId && query.voidedStatementId)  {
        throw new Error('cannot include both statementID and voidedStatementId');
      }
      if(query.statementId || query.voidedStatementId) {
        for(let prop in Object.keys(query)) {
          if (prop === 'attachments' || prop === 'format') {
            continue;
          } else {
            throw new Error(`invalid query parameter ${prop}`)
          }
        }
      }
    } catch(err) {
      next(err);
    }
  }
}
