"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  departmentOptions,
  dsProgrammingTags,
  gradeOptions,
} from "@/lib/constants/profile";
import type { OnboardingState } from "../_lib/actions";
import { saveOnboardingAction } from "../_lib/actions";
import { TagPicker } from "@/components/profile/tag-picker";

type Props = {
  initialInterestTags: string[];
  initialResearchFields: string[];
  initialRealName: string;
  initialDepartment: string;
  initialGrade: string;
};

export function OnboardingForm({
  initialInterestTags,
  initialResearchFields,
  initialRealName,
  initialDepartment,
  initialGrade,
}: Props) {
  const [interestTags, setInterestTags] = useState(initialInterestTags);
  const [researchFields, setResearchFields] = useState(initialResearchFields);
  const [realName, setRealName] = useState(initialRealName);
  const [department, setDepartment] = useState(initialDepartment);
  const [grade, setGrade] = useState(initialGrade);

  const [state, formAction] = useActionState<OnboardingState, FormData>(
    saveOnboardingAction,
    {},
  );

  return (
    <Card className="w-full gap-0 rounded-2xl bg-white py-0 shadow-2xl ring-1 ring-black/5">
      <CardHeader className="space-y-2 px-8 pt-8 pb-2 text-center">
        <CardTitle className="bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] bg-clip-text text-2xl font-bold text-transparent">
          プロフィールを設定
        </CardTitle>
        <CardDescription className="text-sm">
          興味・研究分野を選ぶと、マッチングや検索で活用されます（ログイン後いつでも変更できます）。
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <input type="hidden" name="interest_tags_json" value={JSON.stringify(interestTags)} />
        <input type="hidden" name="research_fields_json" value={JSON.stringify(researchFields)} />

        <CardContent className="space-y-8 px-8 py-6">
          <div className="space-y-4 rounded-xl border border-slate-100 bg-slate-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              基本情報
            </p>
            <div className="space-y-2">
              <Label htmlFor="real_name">本名</Label>
              <Input
                id="real_name"
                name="real_name"
                value={realName}
                onChange={(e) => setRealName(e.target.value)}
                placeholder="例: 山田 太郎"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="department">学部</Label>
                <select
                  id="department"
                  name="department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#667eea]/30"
                >
                  <option value="">（未選択）</option>
                  {departmentOptions.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="grade">学年 / 卒業年度</Label>
                <select
                  id="grade"
                  name="grade"
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="flex h-11 w-full rounded-xl border border-input bg-white px-3 py-2 text-sm outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-[#667eea]/30"
                >
                  <option value="">（未選択）</option>
                  {gradeOptions.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <TagPicker
            label="💛 興味のある分野"
            options={dsProgrammingTags}
            value={interestTags}
            onChange={setInterestTags}
            hint="クリックで選択 / 解除できます"
          />

          <TagPicker
            label="🔬 研究した分野（任意）"
            options={dsProgrammingTags}
            value={researchFields}
            onChange={setResearchFields}
            hint="実際に研究・実践した分野があれば選択してください"
          />

          {state.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
        </CardContent>

        <CardFooter className="flex flex-col gap-4 rounded-b-2xl border-t-0 bg-transparent px-8 pt-2 pb-8">
          <SubmitButton />
          <p className="text-center text-xs text-muted-foreground">
            保存後、ダッシュボードへ移動します。<br />
            プロフィールはいつでも変更できます。
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      className="h-11 w-full bg-[linear-gradient(135deg,#667eea_0%,#764ba2_100%)] text-base font-semibold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 disabled:opacity-60"
      disabled={pending}
    >
      {pending ? "保存中…" : "保存してはじめる"}
    </Button>
  );
}
