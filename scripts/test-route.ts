import { mastra } from "../src/mastra";
import { routeAgentOutputSchema } from "../src/mastra/agents/route-agent";

const input = process.argv[2] || "東京から新大阪";
const agent = mastra.getAgent("routeAgent");
const result = await agent.generate(input);

const text = result.text.trim();
// ```json ... ``` で囲まれてる場合も対応
const jsonStr = text.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

const parsed = routeAgentOutputSchema.safeParse(JSON.parse(jsonStr));
if (!parsed.success) {
  console.error("Schema validation failed:", parsed.error.format());
  console.error("Raw response:", text);
  process.exit(1);
}
console.log(JSON.stringify(parsed.data, null, 2));
