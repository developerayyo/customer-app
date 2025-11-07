import { Layout } from '../components/layout/Layout';

export default function OpenFile() {
  let payload: any = null;
  try {
    const str = sessionStorage.getItem('open-file-payload');
    payload = str ? JSON.parse(str) : null;
  } catch {}

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-2">Opened Files</h1>
        {payload ? (
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-600">Files count:</span> {payload.count || 0}</div>
            <p className="text-gray-500">Add file content parsing/preview here.</p>
          </div>
        ) : (
          <p className="text-gray-500">No files opened via OS handler.</p>
        )}
      </div>
    </Layout>
  );
}