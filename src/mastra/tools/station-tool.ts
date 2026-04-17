import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const GRAPHQL_ENDPOINT = "https://gql-stg.trainlcd.app";

async function gqlRequest(query: string, variables?: Record<string, unknown>) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status} ${res.statusText}`);
  }
  const json = (await res.json()) as { data: Record<string, any>; errors?: unknown[] };
  if (json.errors) {
    throw new Error(
      `GraphQL errors: ${JSON.stringify(json.errors, null, 2)}`
    );
  }
  return json.data;
}

export const searchStationTool = createTool({
  id: "search-station",
  description:
    "駅名で検索して駅情報を取得する。日本語の駅名を渡すと、該当する駅の一覧を返す。",
  inputSchema: z.object({
    name: z.string().describe("検索する駅名（例: 東京、新宿、梅田）"),
  }),
  outputSchema: z.object({
    stations: z.array(
      z.object({
        id: z.number(),
        groupId: z.number(),
        name: z.string(),
        nameKatakana: z.string(),
        nameRoman: z.string().nullable(),
        prefectureId: z.number(),
        latitude: z.number().nullable(),
        longitude: z.number().nullable(),
        status: z.string(),
      })
    ),
  }),
  execute: async ({ name }) => {
    const query = `
      query StationsByName($name: String!) {
        stationsByName(name: $name) {
          id
          groupId
          name
          nameKatakana
          nameRoman
          prefectureId
          latitude
          longitude
          status
        }
      }
    `;
    const data = await gqlRequest(query, { name });
    return { stations: data.stationsByName };
  },
});

export const searchRouteTypesTool = createTool({
  id: "search-route-types",
  description:
    "出発駅と到着駅のgroupIdを指定して、経路の種別（列車タイプ）情報を取得する。searchStationToolで取得したgroupIdを使う。",
  inputSchema: z.object({
    fromStationGroupId: z.number().describe("出発駅のgroupId"),
    toStationGroupId: z.number().describe("到着駅のgroupId"),
  }),
  outputSchema: z.object({
    routeTypes: z.any(),
  }),
  execute: async ({ fromStationGroupId, toStationGroupId }) => {
    const query = `
      query RouteTypes($from: Int!, $to: Int!) {
        routeTypes(fromStationGroupId: $from, toStationGroupId: $to) {
          trainTypes {
            id
            groupId
            typeId
            name
            nameKatakana
            nameRoman
            nameChinese
            nameKorean
            color
            lines {
              id
              nameShort
              nameKatakana
              nameRoman
            }
            direction
          }
          nextPageToken
        }
      }
    `;
    const data = await gqlRequest(query, {
      from: fromStationGroupId,
      to: toStationGroupId,
    });
    return { routeTypes: data.routeTypes };
  },
});
