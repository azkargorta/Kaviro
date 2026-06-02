"use client";

import Reveal from "@/components/ui/Reveal";
import HelpFeedbackForm from "@/components/help/HelpFeedbackForm";

export default function HelpFeedbackSection() {
  return (
    <Reveal variant="fade" className="mt-10">
      <HelpFeedbackForm />
    </Reveal>
  );
}
