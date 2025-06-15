
import React from "react";
import { CategoriesSection } from "./Settings/CategoriesSection";
import { AccountsSection } from "./Settings/AccountsSection";
import { PaymentMethodsSection } from "./Settings/PaymentMethodsSection";
import { PaymentTermsSection } from "./Settings/PaymentTermsSection";

export function FinanceSettingsTab() {
  return (
    <div className="space-y-6 p-2">
      <CategoriesSection />
      <AccountsSection />
      <PaymentMethodsSection />
      <PaymentTermsSection />
    </div>
  );
}
