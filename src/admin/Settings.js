// Settings Component
const Settings = () => (
  <div className="p-6">
    <h1 className="text-2xl font-bold mb-4">Cài đặt</h1>
    <div className="space-y-4">
      <div>
        <label className="block mb-1">Tên website</label>
        <input
          type="text"
          defaultValue="Movie Website"
          className="w-full p-2 border rounded"
        />
      </div>
      <div>
        <label className="block mb-1">Ngôn ngữ mặc định</label>
        <select className="w-full p-2 border rounded">
          <option>Tiếng Việt</option>
          <option>English</option>
        </select>
      </div>
      <button className="px-4 py-2 bg-blue-500 text-white rounded">
        Lưu cài đặt
      </button>
    </div>
  </div>
);

export default Settings;
