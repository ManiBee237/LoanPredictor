import Card from "../components/Card.jsx";

export default function About() {
  return (
    <div className="space-y-4">
      <div className="text-xl font-semibold">About</div>
      <Card title="Project Summary">
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Domain: Finance/Banking — predict loan default.</li>
          <li>Current engine: client-side baseline (CreditScore + DTI heuristic).</li>
          <li>Next step: integrate backend API for Logistic Regression/Decision Tree.</li>
          <li>Visuals: Confusion matrix chart and ROC placeholder.</li>
        </ul>
      </Card>
    </div>
  );
}
