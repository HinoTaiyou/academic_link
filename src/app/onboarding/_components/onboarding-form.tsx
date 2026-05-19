"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
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

const selectClassName =
  "al-auth-input appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10";

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
    <div className="w-full">
      <header className="mb-8 space-y-3">
        <p className="al-section-eyebrow">はじめに</p>
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--al-ink)] sm:text-3xl">
          プロフィールを設定
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-[var(--al-muted)] sm:text-base">
          興味・研究分野を選ぶと、マッチングや検索で活用されます。ログイン後いつでも変更できます。
        </p>
      </header>

      <form action={formAction} className="space-y-8">
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

        <section className="space-y-4 rounded-xl border border-[var(--al-border)] bg-[var(--al-surface-elevated)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--al-muted)]">
            基本情報
          </p>
          <div className="space-y-2">
            <label
              htmlFor="real_name"
              className="text-sm font-medium text-[var(--al-ink)]"
            >
              本名
            </label>
            <input
              id="real_name"
              name="real_name"
              value={realName}
              onChange={(e) => setRealName(e.target.value)}
              placeholder="例：山田 太郎"
              className="al-auth-input"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="department"
                className="text-sm font-medium text-[var(--al-ink)]"
              >
                学部
              </label>
              <select
                id="department"
                name="department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className={selectClassName}
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
              <label
                htmlFor="grade"
                className="text-sm font-medium text-[var(--al-ink)]"
              >
                学年 / 卒業年度
              </label>
              <select
                id="grade"
                name="grade"
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className={selectClassName}
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
          options={dsProgrammingTags}
          value={interestTags}
          onChange={setInterestTags}
          hint="クリックで選択 / 解除できます"
        />

        <TagPicker
          label="研究した分野（任意）"
          options={dsProgrammingTags}
          value={researchFields}
          onChange={setResearchFields}
          hint="実際に研究・実践した分野があれば選択してください"
        />

        {state.error ? (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {state.error}
          </p>
        ) : null}

        <div className="space-y-4 border-t border-[var(--al-border)] pt-6">
          <SubmitButton />
          <p className="text-center text-xs text-[var(--al-muted)]">
            保存後、ダッシュボードへ移動します。
            <br />
            プロフィールはいつでも変更できます。
          </p>
        </div>
      </form>
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="al-btn-gradient h-12 w-full text-sm disabled:opacity-60"
    >
      {pending ? "保存中…" : "保存してはじめる"}
    </button>
  );
}
