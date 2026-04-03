import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { z } from "zod";
import {
  searchStationTool,
  searchRouteTypesTool,
} from "../tools/station-tool";

const stationRef = z.object({
  name: z.string(),
  groupId: z.number(),
});

const stationCandidate = z.object({
  name: z.string(),
  groupId: z.number(),
  nameKatakana: z.string(),
  prefectureId: z.number(),
});

export const routeAgentOutputSchema = z.object({
  status: z.enum(["success", "ambiguous", "no_results"]),
  from: stationRef.optional(),
  to: stationRef.optional(),
  routeTypes: z.any().optional(),
  candidates: z
    .object({
      from: z.array(stationCandidate).nullable(),
      to: z.array(stationCandidate).nullable(),
    })
    .optional(),
  message: z.string().optional(),
});

export type RouteAgentOutput = z.infer<typeof routeAgentOutputSchema>;

export const routeAgent = new Agent({
  id: "route-agent",
  name: "Route Agent",
  instructions: `
    ユーザーの発言から出発駅と到着駅を抽出し、経路種別情報を取得する。
    応答は純粋なJSONのみ出力する。説明文、前置き、補足、マークダウン記法は絶対に含めない。

    手順:
    1. 発言から出発駅名と到着駅名を抽出する（"東京から大阪"、"新宿->渋谷"、"梅田〜難波" など）
    2. searchStationTool で各駅を検索
    3. 候補が一意に定まらない場合 → status: "ambiguous" で候補を返す。確定済みの方はnullにする
    4. 候補が確定したら、出発駅と到着駅のgroupIdが同一でないか確認する
    5. groupIdが同一 → status: "no_results"、message: "出発駅と到着駅が同一駅です"
    6. groupIdが異なれば searchRouteTypesTool を実行
    7. 結果がある → status: "success"、ない → status: "no_results"

    レスポンス形式（これ以外の形式は禁止）:

    成功: {"status":"success","from":{"name":"...","groupId":N},"to":{"name":"...","groupId":N},"routeTypes":{ツール結果そのまま}}
    曖昧: {"status":"ambiguous","candidates":{"from":[...]|null,"to":[...]|null}}
    結果なし: {"status":"no_results","from":{"name":"...","groupId":N},"to":{"name":"...","groupId":N},"message":"理由"}
  `,
  model: "anthropic/claude-sonnet-4-5",
  tools: { searchStationTool, searchRouteTypesTool },
  memory: new Memory(),
});
