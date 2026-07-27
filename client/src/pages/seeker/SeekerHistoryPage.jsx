import RequestsList from "../../components/seeker/RequestsList.jsx";

export default function SeekerHistoryPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request History</h1>
      <RequestsList
        statuses={["completed", "cancelled"]}
        emptyText="এখনো কোনো সম্পন্ন বা বাতিল রিকোয়েস্ট নেই।"
      />
    </div>
  );
}
