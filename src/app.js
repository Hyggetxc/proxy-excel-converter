(function () {
  var emptyState = {
    fileName: "未选择文件",
    sheetName: "—",
    serviceStatus: "等待校验",
    summary: {
      total: 0,
      valid: 0,
      errors: 0,
    },
    rows: [],
    errors: [],
    exportReady: false,
    statusPill: "等待校验",
    statusPillClass: "pill-emerald",
    statusCaption: "请先上传源表并执行校验",
    exportCopy: "等待校验通过后生成并下载目标 Excel。",
  };

  var state = {
    file: null,
    validation: Object.assign({}, emptyState),
  };

  function $(id) {
    return document.getElementById(id);
  }

  function buildFormData() {
    var formData = new FormData();
    formData.append("file", state.file);
    return formData;
  }

  function renderPreviewTable() {
    var tbody = $("preview-body");
    var rows = state.validation.rows;

    if (!rows.length) {
      tbody.innerHTML =
        '<tr><td colspan="7">校验完成后，这里会显示按目标格式转换后的预览结果。</td></tr>';
      return;
    }

    tbody.innerHTML = rows
      .map(function (row) {
        var status = row.status === "通过" ? "success" : "error";
        return (
          "<tr>" +
          '<td class="mono">' + escapeHtml(row.ip) + "</td>" +
          '<td class="mono">' + escapeHtml(row.host || "--") + "</td>" +
          '<td class="mono">' + escapeHtml(row.port || "--") + "</td>" +
          '<td class="mono">' + escapeHtml(row.username || "--") + "</td>" +
          '<td class="mono">' + escapeHtml(row.password || "--") + "</td>" +
          '<td class="mono">' + escapeHtml(row.remark || "") + "</td>" +
          '<td><span class="row-status ' + status + '">' + row.status + "</span></td>" +
          "</tr>"
        );
      })
      .join("");
  }

  function renderSummary() {
    $("file-name").textContent = state.validation.fileName;
    $("sheet-name").textContent = state.validation.sheetName;
    $("dataset-mode").textContent = state.validation.serviceStatus;
    $("total-rows").textContent = state.validation.summary.total;
    $("valid-rows").textContent = state.validation.summary.valid;
    $("error-rows").textContent = state.validation.summary.errors;
    $("status-pill").textContent = state.validation.statusPill;
    $("status-pill").className = "pill " + state.validation.statusPillClass;
    $("status-caption").textContent = state.validation.statusCaption;
    $("export-copy").textContent = state.validation.exportCopy;
    $("export-button").disabled = !state.validation.exportReady;
    $("open-errors-button").disabled = state.validation.errors.length === 0;
    $("validate-button").disabled = !state.file;
  }

  function renderModal() {
    if (!state.validation.errors.length) {
      $("modal-summary").textContent = "当前没有异常项。";
      $("modal-list").innerHTML =
        '<article class="modal-item"><strong>校验通过</strong><p>所有数据都符合当前导出格式要求。</p></article>';
      return;
    }

    $("modal-summary").textContent =
      "本次校验共发现 " + state.validation.errors.length + " 条异常。请按行修正源表后重新上传。";

    $("modal-list").innerHTML = state.validation.errors
      .map(function (item) {
        return (
          '<article class="modal-item">' +
          "<strong>第 " + item.row + " 行</strong>" +
          "<p>" + escapeHtml(item.message) + "</p>" +
          "</article>"
        );
      })
      .join("");
  }

  function render() {
    renderPreviewTable();
    renderSummary();
    renderModal();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function openModal() {
    $("error-modal").hidden = false;
  }

  function closeModal() {
    $("error-modal").hidden = true;
  }

  function setFile(file) {
    state.file = file;
    state.validation = Object.assign({}, emptyState, {
      fileName: file ? file.name : "未选择文件",
      serviceStatus: file ? "已选择文件" : "等待校验",
      statusCaption: file ? "点击开始校验读取真实 Excel" : emptyState.statusCaption,
    });
    render();
  }

  async function checkService(showAlert) {
    try {
      var response = await fetch("/api/health");
      if (!response.ok) throw new Error("health request failed");
      state.validation.serviceStatus = "服务在线";
      renderSummary();
      if (showAlert) {
        alert("本地服务在线，可以执行真实校验与导出。");
      }
    } catch (error) {
      state.validation.serviceStatus = "服务未启动";
      renderSummary();
      if (showAlert) {
        alert("本地服务未启动。请运行 `python3 app.py` 后再试。");
      }
    }
  }

  async function validateFile() {
    if (!state.file) {
      alert("请先选择一个 Excel 文件。");
      return;
    }

    setBusy(true);
    try {
      var response = await fetch("/api/validate", {
        method: "POST",
        body: buildFormData(),
      });
      var payload = await response.json();

      state.validation = {
        fileName: payload.file_name || state.file.name,
        sheetName: payload.sheet_name || "Sheet1",
        serviceStatus: response.ok ? "校验完成" : "校验未通过",
        summary: payload.summary || emptyState.summary,
        rows: payload.rows || [],
        errors: payload.errors || [],
        exportReady: Boolean(payload.ok),
        statusPill: payload.ok ? "校验已通过" : "导出已拦截",
        statusPillClass: payload.ok ? "pill-success" : "pill-danger",
        statusCaption: payload.ok ? "可以导出目标文件" : "请先修正异常数据",
        exportCopy: payload.ok
          ? "proxysheet-export.xlsx 已准备好，当前状态允许导出。"
          : "当前存在异常数据，导出已锁定。",
      };

      render();

      if (!payload.ok && state.validation.errors.length) {
        openModal();
      }
    } catch (error) {
      alert("校验失败，请确认本地服务已启动，并重试。");
    } finally {
      setBusy(false);
    }
  }

  async function exportFile() {
    if (!state.file) {
      alert("请先选择一个 Excel 文件。");
      return;
    }

    setBusy(true);
    try {
      var response = await fetch("/api/export", {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        var payload = await response.json();
        if (payload && payload.errors) {
          state.validation.errors = payload.errors;
          renderModal();
          openModal();
        }
        throw new Error("export failed");
      }

      var blob = await response.blob();
      var disposition = response.headers.get("Content-Disposition") || "";
      var filenameMatch = disposition.match(/filename="([^"]+)"/);
      var filename = filenameMatch ? filenameMatch[1] : "proxysheet-export.xlsx";
      var url = URL.createObjectURL(blob);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert("导出失败，请先确保校验通过，且本地服务正在运行。");
    } finally {
      setBusy(false);
    }
  }

  function setBusy(isBusy) {
    $("validate-button").disabled = isBusy || !state.file;
    $("export-button").disabled = isBusy || !state.validation.exportReady;
    $("check-service-button").disabled = isBusy;
    $("clear-file-button").disabled = isBusy;
    $("upload-dropzone").disabled = isBusy;
  }

  function bindEvents() {
    document.querySelectorAll("[data-jump]").forEach(function (button) {
      button.addEventListener("click", function () {
        var target = document.querySelector(button.dataset.jump);
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });

    $("upload-dropzone").addEventListener("click", function () {
      if ($("upload-dropzone").disabled) return;
      $("file-input").click();
    });

    $("file-input").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      setFile(file);
    });

    $("clear-file-button").addEventListener("click", function () {
      $("file-input").value = "";
      setFile(null);
      closeModal();
    });

    $("check-service-button").addEventListener("click", function () {
      checkService(true);
    });

    $("validate-button").addEventListener("click", validateFile);
    $("export-button").addEventListener("click", exportFile);

    $("open-errors-button").addEventListener("click", function () {
      openModal();
    });

    document.querySelectorAll("[data-close-modal]").forEach(function (node) {
      node.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        closeModal();
      }
    });
  }

  render();
  bindEvents();
})();
