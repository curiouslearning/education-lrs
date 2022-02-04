import dbClient from "../lib/db";

async function addRows(rows) {
  const inserts = await dbClient.$transaction(
    rows.map((row) => dbClient.statement.create({ data: row }))
  );
  return inserts.map((statement) => statement.id);
}

async function all() {
  const rows = await dbClient.statement.findMany();
  return rows.map((row) => row.statement);
}

async function getByIDs(ids) {
  return await dbClient.statement.findMany({
    select: { statement: true },
    where: { id: { in: ids } },
  });
}
