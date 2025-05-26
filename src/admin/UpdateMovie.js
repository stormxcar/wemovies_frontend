import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";

const UpdateMovie = ({ title, items, updateEndpoint }) => {
  const [selectedId, setSelectedId] = useState("");
  const [formData, setFormData] = useState({
    id: "",
    title: "",
    titleByLanguage: "",
    status: "",
    totalEpisodes: null,
    director: "",
    actors: [""],
    duration: "",
    quality: "",
    vietSub: "",
    description: "",
    release_year: 2000,
    movieTypeIds: [],
    categoryIds: [],
    countryId: null,
    hot: "",
    thumb_url: "",
    trailer: "",
    link: "",
    episodeLinks: null,
  });
  const [movieTypes, setMovieTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [episodeLinks, setEpisodeLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch movie types, categories, and countries
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResp, catsResp, countriesResp] = await Promise.all([
          axios.get("http://localhost:8080/api/types"),
          axios.get("http://localhost:8080/api/categories"),
          axios.get("http://localhost:8080/api/countries"),
        ]);
        setMovieTypes(
          typesResp.data.map((t) => ({ value: t.id, label: t.name }))
        );
        setCategories(
          catsResp.data.map((c) => ({ value: c.id, label: c.name }))
        );
        setCountries(
          countriesResp.data.map((c) => ({ value: c.id, label: c.name }))
        );
      } catch (err) {
        console.error("Error fetching options:", err);
        toast.error("Không thể tải dữ liệu lựa chọn. Vui lòng thử lại.");
      }
    };
    fetchOptions();
  }, []);

  // Sync formData with selected item and fetch episode links
  useEffect(() => {
    const syncData = async () => {
      if (!selectedId || selectedId === "") {
        console.log("selectedId is empty, resetting formData");
        setFormData({
          id: "",
          title: "",
          titleByLanguage: "",
          status: "",
          totalEpisodes: null,
          director: "",
          actors: [""],
          duration: "",
          quality: "",
          vietSub: "",
          description: "",
          release_year: 2000,
          movieTypeIds: [],
          categoryIds: [],
          countryId: null,
          hot: "",
          thumb_url: "",
          trailer: "",
          link: "",
          episodeLinks: null,
        });
        setEpisodeLinks([]);
        return;
      }
      setLoading(true);
      const parsedId = parseInt(selectedId);
      if (isNaN(parsedId)) {
        console.warn("Invalid ID, resetting formData");
        setSelectedId("");
        setFormData({
          id: "",
          title: "",
          titleByLanguage: "",
          status: "",
          totalEpisodes: null,
          director: "",
          actors: [""],
          duration: "",
          quality: "",
          vietSub: "",
          description: "",
          release_year: 2000,
          movieTypeIds: [],
          categoryIds: [],
          countryId: null,
          hot: "",
          thumb_url: "",
          trailer: "",
          link: "",
          episodeLinks: null,
        });
        setEpisodeLinks([]);
        setLoading(false);
        return;
      }
      const item = items.find((item) => item.id === parsedId);
      console.log("====================================");
      console.log("Selected ID:", selectedId);
      console.log("Item data:", item);
      console.log("====================================");
      if (item) {
        const movieTypeIds = Array.isArray(item.movieTypes)
          ? item.movieTypes.map((t) => t.id || t.movie_type_id).filter(Boolean)
          : [];
        const categoryIds = Array.isArray(item.movieCategories)
          ? item.movieCategories
              .map((c) => c.id || c.category_id)
              .filter(Boolean)
          : [];
        setFormData({
          id: item.id || "",
          title: item.title || "",
          titleByLanguage: item.titleByLanguage || "",
          status: item.status || "",
          totalEpisodes: item.totalEpisodes || null,
          director: item.director || "",
          actors: item.actors ? Array.from(item.actors) : [""],
          duration: item.duration || "",
          quality: item.quality || "",
          vietSub: item.vietSub ? "true" : "false",
          description: item.description || "",
          release_year: item.release_year || 2000,
          movieTypeIds: movieTypeIds,
          categoryIds: categoryIds,
          countryId: item.country ? item.country.id : null,
          hot: item.hot ? "true" : "false",
          thumb_url: item.thumb_url || "",
          trailer: item.trailer || "",
          link: item.link || "",
          episodeLinks: null,
        });
        try {
          const response = await axios.get(
            `http://localhost:8080/api/movies/${parsedId}/episodes`
          );
          const links = response.data || [];
          setEpisodeLinks(links);
          if (links.length > 0) {
            setFormData((prev) => ({
              ...prev,
              totalEpisodes: links.length.toString(),
              episodeLinks: links,
            }));
          }
        } catch (err) {
          console.error("Error fetching episode links:", err);
          setEpisodeLinks([]);
          toast.error("Không thể tải danh sách tập phim.");
        }
      } else {
        setFormData({
          id: "",
          title: "",
          titleByLanguage: "",
          status: "",
          totalEpisodes: null,
          director: "",
          actors: [""],
          duration: "",
          quality: "",
          vietSub: "",
          description: "",
          release_year: 2000,
          movieTypeIds: [],
          categoryIds: [],
          countryId: null,
          hot: "",
          thumb_url: "",
          trailer: "",
          link: "",
          episodeLinks: null,
        });
        setEpisodeLinks([]);
      }
      setLoading(false);
    };
    syncData();
  }, [selectedId, items]);

  // Handle totalEpisodes and status changes
  useEffect(() => {
    const totalEpisodes = parseInt(formData.totalEpisodes);
    const status = formData.status || ""; // Default to empty string if undefined

    console.log("====================================");
    console.log("status:", status);
    console.log("totalEpisodes:", totalEpisodes);
    console.log("====================================");

    const isFullStatus = status.toLowerCase() === "full";

    if (isFullStatus) {
      setFormData((prev) => ({
        ...prev,
        totalEpisodes: "",
        episodeLinks: null,
        link: prev.link || "",
      }));
      setEpisodeLinks([]);
    } else if (!isNaN(totalEpisodes) && totalEpisodes > 0) {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: Array(totalEpisodes).fill(""),
        link: "",
      }));
      setEpisodeLinks(Array(totalEpisodes).fill(""));
    } else if (formData.episodeLinks && formData.episodeLinks.length > 0) {
      setFormData((prev) => ({
        ...prev,
        totalEpisodes: formData.episodeLinks.length.toString(),
        link: "",
      }));
      setEpisodeLinks([...formData.episodeLinks]);
    } else {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: null,
        link: prev.link || "",
      }));
      setEpisodeLinks([]);
    }
  }, [formData.totalEpisodes, formData.status, formData.episodeLinks]);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle actor changes
  const handleActorChange = (index, e) => {
    const newActors = [...formData.actors];
    newActors[index] = e.target.value;
    setFormData((prev) => ({ ...prev, actors: newActors }));
  };

  // Add new actor input
  const addActor = () => {
    setFormData((prev) => ({ ...prev, actors: [...prev.actors, ""] }));
  };

  // Handle episode link changes
  const handleEpisodeLinkChange = (index, e) => {
    const newEpisodeLinks = [...(formData.episodeLinks || [])];
    newEpisodeLinks[index] = e.target.value;
    setFormData((prev) => ({ ...prev, episodeLinks: newEpisodeLinks }));
  };

  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData((prev) => ({ ...prev, description: data }));
  };

  // Handle Select changes
  const handleSelectChange = (name, selectedOptions) => {
    setFormData((prev) => ({
      ...prev,
      [name]: selectedOptions
        ? Array.isArray(selectedOptions)
          ? selectedOptions.map((o) => o.value)
          : selectedOptions.value
        : name === "countryId"
        ? null
        : [],
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.id) {
      toast.error("Vui lòng chọn một phim để cập nhật.");
      return;
    }
    try {
      const payload = {
        ...formData,
        actors: formData.actors.filter((actor) => actor.trim()),
        episodeLinks: formData.episodeLinks
          ? formData.episodeLinks.filter((link) => link.trim())
          : null,
      };
      const params = new URLSearchParams();
      payload.actors.forEach((actor) => params.append("actors", actor));
      if (payload.episodeLinks) {
        payload.episodeLinks.forEach((link) =>
          params.append("episodeLinks", link)
        );
      }
      params.append("countryId", payload.countryId || "");
      payload.movieTypeIds.forEach((id) => params.append("movieTypeIds", id));
      payload.categoryIds.forEach((id) => params.append("categoryIds", id));

      const response = await axios.put(
        `${updateEndpoint}/${formData.id}`,
        payload,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
          params: params,
        }
      );
      toast.success(`${title} đã được cập nhật`);
      console.log("Updated Item:", response.data);
      navigate(`/admin/movies`);
    } catch (error) {
      console.error(
        "Error updating item:",
        error.response?.data || error.message
      );
      toast.error(error.response?.data || `Lỗi khi cập nhật ${title}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Chỉnh sửa {title}</h1>
      {loading ? (
        <p>Đang tải...</p>
      ) : (
        <>
          <select
            value={selectedId || ""}
            onChange={(e) => {
              console.log(
                "Dropdown selected value:",
                e.target.value,
                "Type:",
                typeof e.target.value
              );
              setSelectedId(e.target.value); // Update selectedId directly
            }}
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="id" value={formData.id} />
              <div>
                <label htmlFor="title" className="block text-sm font-medium">
                  Tiêu đề:
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="titleByLanguage"
                  className="block text-sm font-medium"
                >
                  Tiêu đề (Tiếng Anh/...):
                </label>
                <input
                  type="text"
                  name="titleByLanguage"
                  value={formData.titleByLanguage}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium">
                  Trạng thái:
                </label>
                <input
                  type="text"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="totalEpisodes"
                  className="block text-sm font-medium"
                >
                  Số tập:
                </label>
                <input
                  type="number"
                  name="totalEpisodes"
                  value={formData.totalEpisodes || ""}
                  onChange={handleChange}
                  min="1"
                  disabled={formData.status.toLowerCase() === "full"}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="director" className="block text-sm font-medium">
                  Đạo diễn:
                </label>
                <input
                  type="text"
                  name="director"
                  value={formData.director}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Diễn viên:</label>
                <div id="actors" className="space-y-2">
                  {formData.actors.map((actor, index) => (
                    <input
                      key={index}
                      type="text"
                      value={actor}
                      onChange={(e) => handleActorChange(index, e)}
                      className="w-full p-2 border rounded"
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addActor}
                  className="mt-2 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Thêm diễn viên
                </button>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium">
                  Thời lượng (phút):
                </label>
                <input
                  type="text"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="quality" className="block text-sm font-medium">
                  Chất lượng:
                </label>
                <select
                  name="quality"
                  value={formData.quality}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Chọn chất lượng</option>
                  <option value="SD">SD</option>
                  <option value="HD">HD</option>
                  <option value="FULL_HD">Full HD</option>
                  <option value="_4K">4K</option>
                </select>
              </div>
              <div>
                <label htmlFor="vietSub" className="block text-sm font-medium">
                  Vietsub:
                </label>
                <select
                  name="vietSub"
                  value={formData.vietSub}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Chọn</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium"
                >
                  Mô tả:
                </label>
                {/* <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  maxLength="65535"
                /> */}

                <CKEditor
                  name="description"
                  editor={ClassicEditor}
                  data={formData.description}
                  onChange={handleEditorChange}
                  className="w-full"
                />
              </div>
              <div>
                <label
                  htmlFor="release_year"
                  className="block text-sm font-medium"
                >
                  Năm phát hành:
                </label>
                <input
                  type="number"
                  name="release_year"
                  value={formData.release_year}
                  onChange={handleChange}
                  min="1900"
                  max="2100"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label
                  htmlFor="movieTypes"
                  className="block text-sm font-medium"
                >
                  Thể loại:
                </label>
                <Select
                  isMulti
                  name="movieTypeIds"
                  options={movieTypes}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("movieTypeIds", selected)
                  }
                  value={
                    movieTypes.filter((opt) =>
                      formData.movieTypeIds.includes(opt.value)
                    ) || []
                  }
                />
              </div>
              <div>
                <label htmlFor="category" className="block text-sm font-medium">
                  Danh mục:
                </label>
                <Select
                  isMulti
                  name="categoryIds"
                  options={categories}
                  className="basic-multi-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("categoryIds", selected)
                  }
                  value={
                    categories.filter((opt) =>
                      formData.categoryIds.includes(opt.value)
                    ) || []
                  }
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium">
                  Quốc gia:
                </label>
                <Select
                  name="countryId"
                  options={countries}
                  className="basic-single-select"
                  classNamePrefix="select"
                  onChange={(selected) =>
                    handleSelectChange("countryId", selected)
                  }
                  value={
                    countries.find((opt) => opt.value === formData.countryId) ||
                    null
                  }
                />
              </div>
              <div>
                <label htmlFor="hot" className="block text-sm font-medium">
                  Phim hot:
                </label>
                <select
                  name="hot"
                  value={formData.hot}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="">Chọn</option>
                  <option value="true">Có</option>
                  <option value="false">Không</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="thumb_url"
                  className="block text-sm font-medium"
                >
                  Ảnh bìa:
                </label>
                <input
                  type="text"
                  name="thumb_url"
                  value={formData.thumb_url}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="trailer" className="block text-sm font-medium">
                  Đường dẫn (trailer):
                </label>
                <input
                  type="text"
                  name="trailer"
                  value={formData.trailer}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label htmlFor="link" className="block text-sm font-medium">
                  Đường dẫn (phát chính):
                </label>
                <input
                  type="text"
                  name="link"
                  value={formData.link}
                  onChange={handleChange}
                  disabled={
                    formData.episodeLinks && formData.episodeLinks.length > 0
                  }
                  className="w-full p-2 border rounded"
                />
              </div>
              {formData.episodeLinks && formData.episodeLinks.length > 0 && (
                <div>
                  <label className="block text-sm font-medium">
                    Đường dẫn các tập:
                  </label>
                  {formData.episodeLinks.map((link, index) => (
                    <div key={index} className="form-group">
                      <label
                        htmlFor={`episodeLink${index + 1}`}
                        className="block text-sm font-medium"
                      >
                        Tập {index + 1}:
                      </label>
                      <input
                        type="text"
                        id={`episodeLink${index + 1}`}
                        value={link}
                        onChange={(e) => handleEpisodeLinkChange(index, e)}
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  ))}
                </div>
              )}
              <div className="flex space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-red-700 rounded text-white"
                  onClick={() => {
                    const hasChanges = Object.keys(formData).some(
                      (key) => formData[key] !== "" && formData[key] !== null
                    );
                    if (hasChanges) {
                      if (
                        window.confirm("Bạn có muốn lưu các thay đổi không?")
                      ) {
                        handleSubmit(new Event("submit"));
                      } else {
                        navigate(-1);
                      }
                    } else {
                      navigate(-1);
                    }
                  }}
                >
                  Hủy
                </button>
                <button
                  type="reset"
                  className="px-4 py-2 bg-green-400 text-white rounded hover:bg-green-600"
                >
                  Làm mới
                </button>
                <button
                  type="submit"
                  onClick={() => {
                    const hasChanges = Object.keys(formData).some(
                      (key) => formData[key] !== "" && formData[key] !== null
                    );
                    if (!hasChanges) {
                      toast.error("Không có thay đổi nào để cập nhật.");
                      return;
                    }

                    if (hasChanges) {
                      window.confirm(
                        `Bạn có chắc chắn muốn cập nhật ${title} này không?`
                      ) && handleSubmit(new Event("submit"));
                    }
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Cập nhật
                </button>
              </div>
            </form>
          )}
        </>
      )}
    </div>
  );
};

export default UpdateMovie;
