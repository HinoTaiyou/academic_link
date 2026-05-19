"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FlaskConical, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TagPicker } from "@/components/profile/tag-picker";
import {
  departmentOptions,
  dsProgrammingTags,
  gradeOptions,
} from "@/lib/constants/profile";
import { cn } from "@/lib/utils";
import {
  updateProfileAction,
  type ProfileUpdateState,
} from "../_lib/actions";

const fieldClass = "al-auth-input h-11 shadow-none focus:ring-[var(--al-accent)]/20";
const selectClass = cn(fieldClass, "appearance-none");

type Props = {
  initialInterestTags: string[];
  initialResearchFields: string[];
  initialRealName: string;
  initialDepartment: string;
  initialGrade: string;
};

export function ProfileEditForm({
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

  const [state, formAction] = useActionState<ProfileUpdateState, FormData>(
    updateProfileAction,
    {},
  );

  return (
    <form action={formAction} className="al-glass-card space-y-6 p-6">
      <input
        type="hidden"
        name="interest_tags_json"
        value={JSON.stringify(interestTags)}
      />
      <input
        type="hidden"
        name="research_fields_json"
        value={JSON.stringify(researchFields)}
      />

      <section className="space-y-4 rounded-xl border border-[var(--al-border)] bg-[var(--al-surface)]/80 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--al-muted)]">
          基本情報
        </p>
        <div className="space-y-2">
          <Label htmlFor="real_name" className="text-[var(--al-ink)]">
            本名
          </Label>
          <Input
            id="real_name"
            name="real_name"
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="例: 山田 太郎"
            className={fieldClass}
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="department" className="text-[var(--al-ink)]">
              学部
            </Label>
            <select
              id="department"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className={selectClass}
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
            <Label htmlFor="grade" className="text-[var(--al-ink)]">
              学年 / 卒業年度
            </Label>
            <select
              id="grade"
              name="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={selectClass}
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
      </section>

      <TagPicker
        label="興味のある分野"
        icon={Sparkles}
        options={dsProgrammingTags}
        value={interestTags}
        onChange={setInterestTags}
        hint="クリックで選択 / 解除できます"
      />

      <TagPicker
        label="研究した分野（任意）"
        icon={FlaskConical}
        options={dsProgrammingTags}
        value={researchFields}
        onChange={setResearchFields}
        hint="実際に研究・実践した分野があれば選択してください"
      />

      {(state.error || state.ok) && (
        <div className="space-y-2">
          {state.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {state.error}
            </p>
          ) : null}
          {state.ok ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
              プロフィールを保存しました。
            </p>
          ) : null}
        </div>
      )}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="al-btn-gradient inline-flex h-11 min-w-[10rem] items-center justify-center px-5 text-sm disabled:opacity-60"
    >
      {pending ? "保存中…" : "変更を保存"}
    </button>
  );
}
