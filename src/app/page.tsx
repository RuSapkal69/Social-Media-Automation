import UploadForm from "@/components/UploadForm";
import History from "@/components/History";
import "./globals.css";

export default function Home() {
  return (
    <main className="p-8">
      <UploadForm />
      <History />
    </main>
  );
}
