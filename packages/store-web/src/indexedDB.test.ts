import { Entity, EventID, Task } from "@withorbit/core2";
import { core2 as testFixtures } from "@withorbit/sample-data";
import {
  DatabaseBackend,
  DatabaseBackendEntityRecord,
} from "@withorbit/store-shared";
// @ts-ignore Looks like there is no @types for this library
import FDBFactory from "fake-indexeddb/lib/FDBFactory";
import { IDBDatabaseBackend } from "./indexedDB";

const { createTestTask } = testFixtures;

let backend: IDBDatabaseBackend;

const testTasks: DatabaseBackendEntityRecord<Task>[] = [
  {
    entity: createTestTask({
      id: "a",
      dueTimestampMillis: 50,
    }),
    lastEventID: "x" as EventID,
    lastEventTimestampMillis: 5,
  },
  {
    entity: createTestTask({
      id: "b",
      dueTimestampMillis: 100,
    }),
    lastEventID: "y" as EventID,
    lastEventTimestampMillis: 4,
  },
  {
    entity: createTestTask({
      id: "c",
      dueTimestampMillis: 150,
    }),
    lastEventID: "z" as EventID,
    lastEventTimestampMillis: 3,
  },
];

beforeEach(() => {
  indexedDB = new FDBFactory();
  backend = new IDBDatabaseBackend("OrbitDatabase", indexedDB);
});

async function putEntities(
  backend: DatabaseBackend,
  entities: DatabaseBackendEntityRecord<Entity>[],
) {
  await backend.modifyEntities(
    [],
    async () => new Map(entities.map((e) => [e.entity.id, e])),
  );
}

describe("task components", () => {
  test("created on insert", async () => {
    await putEntities(backend, testTasks);

    const results = await fetchAllRowsForTable("derived_taskComponents");
    const filteredResults = results.filter(
      (component: { taskID: string }) => component.taskID == "a",
    );

    expect(filteredResults.length).toBe(2);
    expect(filteredResults[0]).toMatchInlineSnapshot(`
      Object {
        "componentID": "a",
        "dueTimestampMillis": 50,
        "taskID": "a",
      }
    `);
    expect(filteredResults[1]).toMatchInlineSnapshot(`
      Object {
        "componentID": "b",
        "dueTimestampMillis": 50,
        "taskID": "a",
      }
    `);
  });

  test("modified on update", async () => {
    await putEntities(backend, testTasks);

    const updatedTask = createTestTask({
      id: "a",
      dueTimestampMillis: 300,
    });
    delete updatedTask.componentStates["b"];
    const updatedRecord: DatabaseBackendEntityRecord<Task> = {
      entity: updatedTask,
      lastEventID: "y" as EventID,
      lastEventTimestampMillis: 20,
    };
    await backend.modifyEntities([updatedTask.id], async (entityMap) => {
      const output = new Map(entityMap);
      output.set(updatedTask.id, updatedRecord);
      return output;
    });

    const results = await fetchAllRowsForTable("derived_taskComponents");
    const filteredResults = results.filter(
      (component: { taskID: string }) => component.taskID == "a",
    );

    expect(filteredResults.length).toBe(1);
    expect(filteredResults[0]).toMatchInlineSnapshot(`
      Object {
        "componentID": "a",
        "dueTimestampMillis": 300,
        "taskID": "a",
      }
    `);
  });
});

async function createIndexedDBConnection(): Promise<IDBDatabase> {
  const DBOpenRequest = indexedDB.open("OrbitDatabase");
  return new Promise((resolve) => {
    DBOpenRequest.onsuccess = () => {
      resolve(DBOpenRequest.result);
    };
  });
}

async function fetchAllRowsForTable(table: string): Promise<any[]> {
  const db = await createIndexedDBConnection();
  const transaction = db.transaction(table, "readonly");
  const store = transaction.objectStore(table);
  const request = store.getAll();
  return await new Promise<any[]>((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
}