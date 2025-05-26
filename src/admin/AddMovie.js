import React, { useState, useEffect } from "react";
import axios from "axios";
import Select from "react-select";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import ClassicEditor from "@ckeditor/ckeditor5-build-classic";
import { toast } from "react-toastify";

const AddMovie = () => {
  const [formData, setFormData] = useState({
    title: "",
    titleByLanguage: "",
    status: "",
    totalEpisodes: "",
    director: "",
    actors: [""],
    duration: "",
    quality: "",
    vietSub: "",
    description: "",
    release_year: 2000,
    movieTypeIds: [], // Initialized as empty array
    categoryIds: [], // Initialized as empty array
    countryId: null, // Initialized as null for single select
    hot: "",
    thumb_url: "",
    trailer: "",
    link: "",
    episodeLinks: null,
  });
  const [movieTypes, setMovieTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch initial data
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [typesResp, catsResp, countriesResp] = await Promise.all([
          axios.get(`${process.env.REACT_APP_API_URL}/api/types`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/categories`),
          axios.get(`${process.env.REACT_APP_API_URL}/api/countries`),
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
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      }
    };
    fetchOptions();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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

  // Handle actor input changes
  const handleActorChange = (index, e) => {
    const newActors = [...formData.actors];
    newActors[index] = e.target.value;
    setFormData((prev) => ({ ...prev, actors: newActors }));
  };

  // Add new actor input
  const addActor = () => {
    setFormData((prev) => ({ ...prev, actors: [...prev.actors, ""] }));
  };

  // Handle CKEditor change
  const handleEditorChange = (event, editor) => {
    const data = editor.getData();
    setFormData((prev) => ({ ...prev, description: data }));
  };

  // Handle episode links based on totalEpisodes and status
  useEffect(() => {
    const totalEpisodes = parseInt(formData.totalEpisodes);
    if (formData.status.toLowerCase() === "full") {
      setFormData((prev) => ({
        ...prev,
        totalEpisodes: "",
        episodeLinks: null,
        link: prev.link || "",
      }));
    } else if (!isNaN(totalEpisodes) && totalEpisodes > 0) {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: Array(totalEpisodes).fill(""),
        link: "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        episodeLinks: null,
        link: prev.link || "",
      }));
    }
  }, [formData.totalEpisodes, formData.status]);

  // Handle episode link changes
  const handleEpisodeLinkChange = (index, e) => {
    const newEpisodeLinks = [...(formData.episodeLinks || [])];
    newEpisodeLinks[index] = e.target.value;
    setFormData((prev) => ({ ...prev, episodeLinks: newEpisodeLinks }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Prepare payload for the Movie entity (only fields expected in the body)
      const payload = {
        title: formData.title,
        titleByLanguage: formData.titleByLanguage,
        status: formData.status,
        totalEpisodes: formData.totalEpisodes || null, // Convert empty string to null
        director: formData.director,
        duration: formData.duration,
        quality: formData.quality,
        vietSub: formData.vietSub,
        description: formData.description,
        release_year: formData.release_year,
        hot: formData.hot,
        thumb_url: formData.thumb_url,
        trailer: formData.trailer,
        link: formData.link, // Only set if episodeLinks is null
      };

      // Prepare params for RequestParam
      const params = new URLSearchParams();
      // Append actors
      formData.actors
        .filter((actor) => actor.trim())
        .forEach((actor) => params.append("actors", actor));
      // Append episodeLinks if they exist
      if (formData.episodeLinks && formData.episodeLinks.length > 0) {
        formData.episodeLinks
          .filter((link) => link.trim())
          .forEach((link) => params.append("episodeLinks", link));
      }
      // Append other required parameters
      params.append("countryId", formData.countryId || "");
      formData.movieTypeIds.forEach((id) => params.append("movieTypeIds", id));
      formData.categoryIds.forEach((id) => params.append("categoryIds", id));

      console.log("Payload:", payload); // Debug log
      console.log("Params:", params.toString()); // Debug log

      const response = await axios.post(
        "${process.env.REACT_APP_API_URL}/api/movies/add",
        payload,
        {
          headers: { "Content-Type": "application/json" },
          params: params,
        }
      );
      toast.success("Phim đã được thêm thành công!");
      setFormData({
        title: "",
        titleByLanguage: "",
        status: "",
        totalEpisodes: "",
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
    } catch (err) {
      console.error("Error adding movie:", err);
      toast.error("Lỗi khi thêm phim. Vui lòng thử lại.");
      setError(err.response?.data?.message || "Lỗi không xác định.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Thêm phim mới</h1>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium">
            Tiêu đề:
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
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
            id="titleByLanguage"
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
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="totalEpisodes" className="block text-sm font-medium">
            Số tập:
          </label>
          <input
            type="number"
            id="totalEpisodes"
            name="totalEpisodes"
            value={formData.totalEpisodes}
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
            id="director"
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
            id="duration"
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
            id="quality"
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
            id="vietSub"
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
          <label htmlFor="description" className="block text-sm font-medium">
            Mô tả:
          </label>
          <CKEditor
            editor={ClassicEditor}
            data={formData.description}
            onChange={handleEditorChange}
            className="w-full"
          />
        </div>
        <div>
          <label htmlFor="release_year" className="block text-sm font-medium">
            Năm phát hành:
          </label>
          <input
            type="number"
            id="release_year"
            name="release_year"
            value={formData.release_year}
            onChange={handleChange}
            min="1900"
            max="2100"
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="movieTypes" className="block text-sm font-medium">
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
            onChange={(selected) => handleSelectChange("categoryIds", selected)}
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
            onChange={(selected) => handleSelectChange("countryId", selected)}
            value={
              countries.find((opt) => opt.value === formData.countryId) || null
            }
          />
        </div>
        <div>
          <label htmlFor="hot" className="block text-sm font-medium">
            Phim hot:
          </label>
          <select
            id="hot"
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
          <label htmlFor="thumb_url" className="block text-sm font-medium">
            Ảnh bìa:
          </label>
          <input
            type="text"
            id="thumb_url"
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
            id="trailer"
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
            id="link"
            name="link"
            value={formData.link}
            onChange={handleChange}
            disabled={formData.episodeLinks && formData.episodeLinks.length > 0}
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
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? "Đang thêm..." : "Thêm"}
        </button>
      </form>
    </div>
  );
};

export default AddMovie;
