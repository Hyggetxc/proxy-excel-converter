(function () {
  var REQUIRED_HEADERS = ["IP地址", "代理地址:端口号", "账号", "密码"];
  var TARGET_HEADERS = ["IP地址", "代理地址", "代理端口", "代理账号", "代理密码", "备注"];

  var emptyState = {
    fileName: "未选择文件",
    sheetName: "—",
    mode: "等待校验",
    summary: {
      total: 0,
      valid: 0,
      errors: 0,
    },
    rows: [],
    errors: [],
    exportReady: false,
    exportRows: [],
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
    $("dataset-mode").textContent = state.validation.mode;
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
          "<strong>" + escapeHtml(item.scope || ("第 " + item.row + " 行")) + "</strong>" +
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
      mode: file ? "已选择文件" : "等待校验",
      statusCaption: file ? "点击开始校验读取真实 Excel" : emptyState.statusCaption,
    });
    render();
  }

  function isBlank(value) {
    return String(value == null ? "" : value).trim() === "";
  }

  function normalizeCell(value) {
    return String(value == null ? "" : value).trim();
  }

  function isValidIpv4(value) {
    if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(value)) {
      return false;
    }

    return value.split(".").every(function (part) {
      var num = Number(part);
      return num >= 0 && num <= 255;
    });
  }

  function splitHostPort(value) {
    var raw = normalizeCell(value);
    var index = raw.lastIndexOf(":");

    if (index <= 0 || index === raw.length - 1) {
      return null;
    }

    return {
      host: raw.slice(0, index).trim(),
      port: raw.slice(index + 1).trim(),
    };
  }

  function collectHeaderMap(headerRow) {
    var headerMap = {};

    headerRow.forEach(function (cell, index) {
      var key = normalizeCell(cell);
      if (key) {
        headerMap[key] = index;
      }
    });

    return headerMap;
  }

  function getCellByHeader(row, headerMap, headerName) {
    if (!(headerName in headerMap)) {
      return "";
    }
    return normalizeCell(row[headerMap[headerName]]);
  }

  function isDataRowEmpty(row, headerMap) {
    return ["IP地址", "代理地址:端口号", "账号", "密码", "备注"].every(function (header) {
      return isBlank(getCellByHeader(row, headerMap, header));
    });
  }

  function buildHeaderErrors(headerMap) {
    var missingHeaders = REQUIRED_HEADERS.filter(function (header) {
      return !(header in headerMap);
    });

    if (!missingHeaders.length) {
      return [];
    }

    return missingHeaders.map(function (header) {
      return {
        row: 1,
        scope: "表头缺失",
        message: "缺少必需列：" + header,
      };
    });
  }

  function validateWorkbook(file, workbook) {
    var firstSheetName = workbook.SheetNames[0];
    var sheet = workbook.Sheets[firstSheetName];
    var matrix = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      raw: false,
      defval: "",
      blankrows: false,
    });
    var headerRow = matrix[0] || [];
    var headerMap = collectHeaderMap(headerRow);
    var headerErrors = buildHeaderErrors(headerMap);
    var errors = headerErrors.slice();
    var rows = [];
    var exportRows = [];
    var totalRows = 0;

    if (!matrix.length) {
      errors.push({
        row: 1,
        scope: "工作表为空",
        message: "当前 Excel 没有可读取的数据。",
      });
    }

    if (!headerErrors.length) {
      matrix.slice(1).forEach(function (row, index) {
        var excelRowNumber = index + 2;

        if (isDataRowEmpty(row, headerMap)) {
          return;
        }

        totalRows += 1;

        var ip = getCellByHeader(row, headerMap, "IP地址");
        var proxy = getCellByHeader(row, headerMap, "代理地址:端口号");
        var username = getCellByHeader(row, headerMap, "账号");
        var password = getCellByHeader(row, headerMap, "密码");
        var remark = getCellByHeader(row, headerMap, "备注");
        var rowErrors = [];
        var parsedProxy = splitHostPort(proxy);
        var host = parsedProxy ? parsedProxy.host : "";
        var port = parsedProxy ? parsedProxy.port : "";

        if (!ip) {
          rowErrors.push("缺少 IP地址");
        } else if (!isValidIpv4(ip)) {
          rowErrors.push("IP地址格式不正确");
        }

        if (!proxy) {
          rowErrors.push("缺少 代理地址:端口号");
        } else if (!parsedProxy || !host) {
          rowErrors.push("代理地址:端口号 格式错误");
        }

        if (!port) {
          rowErrors.push("缺少代理端口");
        } else if (!/^\d+$/.test(port)) {
          rowErrors.push("代理端口必须为数字");
        } else {
          var portNumber = Number(port);
          if (portNumber < 1 || portNumber > 65535) {
            rowErrors.push("代理端口必须在 1-65535 之间");
          }
        }

        if (!username) {
          rowErrors.push("缺少 账号");
        }

        if (!password) {
          rowErrors.push("缺少 密码");
        }

        if (rowErrors.length) {
          errors.push({
            row: excelRowNumber,
            scope: "第 " + excelRowNumber + " 行",
            message: rowErrors.join("；"),
          });
        } else {
          exportRows.push([ip, host, port, username, password, remark]);
        }

        rows.push({
          ip: ip,
          host: host,
          port: port,
          username: username,
          password: password,
          remark: remark,
          status: rowErrors.length ? "异常" : "通过",
        });
      });
    }

    if (!totalRows && !errors.length) {
      errors.push({
        row: 2,
        scope: "没有可校验的数据",
        message: "表头已识别，但没有找到可导出的有效数据行。",
      });
    }

    var ok = errors.length === 0 && exportRows.length > 0;

    return {
      fileName: file.name,
      sheetName: firstSheetName || "Sheet1",
      mode: ok ? "校验完成" : "校验未通过",
      summary: {
        total: totalRows,
        valid: exportRows.length,
        errors: errors.length,
      },
      rows: rows,
      errors: errors,
      exportReady: ok,
      exportRows: exportRows,
      statusPill: ok ? "校验已通过" : "导出已拦截",
      statusPillClass: ok ? "pill-success" : "pill-danger",
      statusCaption: ok ? "可以导出目标文件" : "请先修正异常数据",
      exportCopy: ok
        ? "proxysheet-export.xlsx 已准备好，当前状态允许导出。"
        : "当前存在异常数据，导出已锁定。",
    };
  }

  async function validateFile() {
    if (!state.file) {
      alert("请先选择一个 Excel 文件。");
      return;
    }

    if (!window.XLSX) {
      alert("Excel 解析库加载失败，请刷新页面后重试。");
      return;
    }

    setBusy(true);

    try {
      var buffer = await state.file.arrayBuffer();
      var workbook = XLSX.read(buffer, { type: "array" });
      state.validation = validateWorkbook(state.file, workbook);
      render();

      if (!state.validation.exportReady && state.validation.errors.length) {
        openModal();
      }
    } catch (error) {
      alert("文件读取失败，请确认上传的是有效的 .xlsx 文件。");
    } finally {
      setBusy(false);
    }
  }

  function exportFile() {
    if (!state.validation.exportReady) {
      alert("当前未通过校验，无法导出。");
      return;
    }

    if (!window.XLSX) {
      alert("Excel 导出库加载失败，请刷新页面后重试。");
      return;
    }

    setBusy(true);

    try {
      var workbook = XLSX.utils.book_new();
      var sheetData = [TARGET_HEADERS].concat(state.validation.exportRows);
      var worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "代理导出");
      XLSX.writeFile(workbook, "proxysheet-export.xlsx");
    } catch (error) {
      alert("导出失败，请重新校验后再试。");
    } finally {
      setBusy(false);
    }
  }

  function setBusy(isBusy) {
    $("validate-button").disabled = isBusy || !state.file;
    $("export-button").disabled = isBusy || !state.validation.exportReady;
    $("clear-file-button").disabled = isBusy;
    $("upload-dropzone").disabled = isBusy;
  }

  function bindEvents() {
    $("upload-dropzone").addEventListener("click", function () {
      if ($("upload-dropzone").disabled) return;
      $("file-input").click();
    });

    $("file-input").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      if (!file) return;
      setFile(file);
      closeModal();
    });

    $("clear-file-button").addEventListener("click", function () {
      $("file-input").value = "";
      setFile(null);
      closeModal();
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
