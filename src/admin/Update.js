import React, { useState } from "react";
import { toast } from "react-toastify";

const Update = ({ title, items, onUpdate }) => {
  const sampleMovies = [
    {
      id: 1,
      title: "Inception",
      category: "Action",
      country: "USA",
      type: "Movie",
      year: 2010,
      description:
        "A thief who steals corporate secrets through dream infiltration technology.",
    },
    {
      id: 2,
      title: "Parasite",
      category: "Drama",
      country: "Korea",
      type: "Movie",
      year: 2019,
      description:
        "A poor family schemes to become employed by a wealthy family.",
    },
  ];
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
  const sampleUsers = [
    { id: 1, username: "admin1", email: "admin1@example.com" },
    { id: 2, username: "admin2", email: "admin2@example.com" },
  ];

  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState({});

  const handleSelect = (id) => {
    const item = items.find((item) => item.id === parseInt(id));
    setSelectedId(id);
    setFormData(item || {});
  };

  const handleSubmit = () => {
    onUpdate(formData);
    toast.success(`${title} đã được cập nhật`);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cập nhật {title}</h1>
      <select
        value={selectedId}
        onChange={(e) => handleSelect(e.target.value)}
        className="w-full p-2 mb-4 border rounded"
      >
        <option value="">Chọn {title}</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.title || item.name || item.username}
          </option>
        ))}
      </select>
      {selectedId && (
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
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 border rounded"
            />
          )}
          {title === "Quốc gia" && (
            <input
              type="text"
              placeholder="Tên quốc gia"
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
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
            Cập nhật
          </button>
        </div>
      )}
    </div>
  );
};

export default Update;
