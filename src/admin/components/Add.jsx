import React, { useState } from "react";
import { toast } from "react-toastify";

// Add Component (Generic)
// Add Component
const Add = ({ title, onAdd }) => {
  const sampleCategories = [
    { id: 1, name: "Action" },
    { id: 2, name: "Drama" },
  ];
  const sampleCountries = [
    { id: 1, name: "USA" },
    { id: 2, name: "Korea" },
  ];
  const sampleTypes = [
    { id: 1, name: "Movie" },
    { id: 2, name: "Series" },
  ];
  const [formData, setFormData] = useState({});

  const handleSubmit = () => {
    onAdd(formData);
    toast.success(`${title} đã được thêm`);
    setFormData({});
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm {title}</h1>
      <div className="space-y-4">
        {title === "Phim" && (
          <>
            <input
              type="text"
              placeholder="Tên phim"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <select
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Chọn danh mục</option>
              {sampleCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
            <select
              value={formData.country || ""}
              onChange={(e) =>
                setFormData({ ...formData, country: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Chọn quốc gia</option>
              {sampleCountries.map((country) => (
                <option key={country.id} value={country.name}>
                  {country.name}
                </option>
              ))}
            </select>
            <select
              value={formData.type || ""}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value })
              }
              className="w-full p-2 border rounded"
            >
              <option value="">Chọn loại</option>
              {sampleTypes.map((type) => (
                <option key={type.id} value={type.name}>
                  {type.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Năm sản xuất"
              value={formData.year || ""}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <textarea
              placeholder="Mô tả"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full p-2 border rounded"
            ></textarea>
          </>
        )}
        {title === "Danh mục" && (
          <input
            type="text"
            placeholder="Tên danh mục"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        )}
        {title === "Quốc gia" && (
          <input
            type="text"
            placeholder="Tên quốc gia"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        )}
        {title === "Loại phim" && (
          <input
            type="text"
            placeholder="Tên loại phim"
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
        )}
        {title === "Người dùng" && (
          <>
            <input
              type="text"
              placeholder="Tên người dùng"
              value={formData.username || ""}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
            <input
              type="email"
              placeholder="Email"
              value={formData.email || ""}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          </>
        )}
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Thêm
        </button>
      </div>
    </div>
  );
};

export default Add;
