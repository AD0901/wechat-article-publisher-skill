import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";

const require = createRequire(import.meta.url);
const { Document, Packer, Paragraph, TextRun, HeadingLevel, LevelFormat, AlignmentType } = require("docx");
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const source = await fs.readFile(path.join(ROOT, "prompts", "绿色技术日报系统提示词.md"), "utf8");

const children = [];
let bulletIndex = 0;
for (const line of source.split(/\r?\n/)) {
  if (!line.trim()) { children.push(new Paragraph({ spacing: { after: 90 } })); continue; }
  if (line.startsWith("# ")) { children.push(new Paragraph({ heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER, children: [new TextRun({ text: line.slice(2), bold: true, size: 38, color: "173B31" })] })); continue; }
  if (line.startsWith("## ")) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: line.slice(3), bold: true, color: "1C664D" })] })); continue; }
  if (line.startsWith("### ")) { children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: line.slice(4), bold: true, color: "315E4C" })] })); continue; }
  if (line.startsWith("- [ ") || line.startsWith("- ")) {
    const text = line.replace(/^- \[ \] /, "").replace(/^- /, "");
    children.push(new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun(text)] }));
    continue;
  }
  if (/^\d+\. /.test(line)) {
    children.push(new Paragraph({ numbering: { reference: "numbers", level: 0 }, children: [new TextRun(line.replace(/^\d+\. /, ""))] }));
    continue;
  }
  children.push(new Paragraph({ children: [new TextRun(line.replace(/`([^`]+)`/g, "$1").replace(/\*\*/g, ""))], spacing: { after: 120 } }));
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Microsoft YaHei", size: 22, color: "263B32" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Microsoft YaHei", size: 30, bold: true, color: "1C664D" }, paragraph: { spacing: { before: 260, after: 160 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { font: "Microsoft YaHei", size: 25, bold: true, color: "315E4C" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 1 } }
    ]
  },
  numbering: { config: [
    { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 520, hanging: 260 } } } }] },
    { reference: "numbers", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 520, hanging: 260 } } } }] }
  ] },
  sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1100, right: 1100, bottom: 1100, left: 1100 } } }, children }]
});
const target = path.join(ROOT, "绿色技术日报系统提示词_v2.docx");
await fs.writeFile(target, await Packer.toBuffer(doc));
console.log(target);
