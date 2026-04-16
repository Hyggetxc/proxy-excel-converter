(function () {
  var REQUIRED_HEADERS = ["IP地址", "代理地址:端口号", "账号", "密码"];
  var TARGET_HEADERS = ["IP地址", "代理地址", "代理端口", "代理账号", "代理密码", "备注"];
  var TAB_IDS = ["s5", "excel"];
  var EXPORT_PRESETS = {
    plain: {
      label: "明文配置",
      pattern: "socks5://账号:密码@地址:端口#备注",
      render: function (row) {
        return "socks5://" + row.username + ":" + row.password + "@" + row.host + ":" + row.port + "#" + row.remark;
      },
    },
    yundeng: {
      label: "云登",
      pattern: "socks5://代理地址:代理端口:代理账号:代理密码{备注}",
      render: function (row) {
        return "socks5://" + row.host + ":" + row.port + ":" + row.username + ":" + row.password + "{" + row.remark + "}";
      },
    },
  };

  var emptyExcelState = {
    fileName: "未选择文件",
    sheetName: "—",
    mode: "等待校验",
    summary: { total: 0, valid: 0, errors: 0 },
    rows: [],
    errors: [],
    exportReady: false,
    exportRows: [],
    statusPill: "等待校验",
    statusPillClass: "pill-emerald",
    statusCaption: "请先上传源表并执行校验",
    exportCopy: "等待校验通过后生成并下载目标 Excel。",
  };

  var emptyS5State = {
    preset: "plain",
    input: "",
    summary: { total: 0, valid: 0, errors: 0 },
    rows: [],
    errors: [],
    outputText: "",
    copyReady: false,
    statusPill: "等待解析",
    statusPillClass: "pill-emerald",
    statusCaption: "请选择导出格式后开始解析",
    copyCaption: "解析通过后可一键复制全部结果，每条配置单独换行。",
  };

  var state = {
    activeTab: "s5",
    modalErrors: [],
    modalTitle: "异常数据明细",
    file: null,
    excel: Object.assign({}, emptyExcelState),
    s5: Object.assign({}, emptyS5State),
  };

  function $(id) {
    return document.getElementById(id);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeCell(value) {
    return String(value == null ? "" : value).trim();
  }

  function isBlank(value) {
    return normalizeCell(value) === "";
  }

  function setActiveTab(tabId) {
    state.activeTab = TAB_IDS.indexOf(tabId) >= 0 ? tabId : "s5";
    TAB_IDS.forEach(function (id) {
      var isActive = state.activeTab === id;
      $("tab-trigger-" + id).classList.toggle("active", isActive);
      $("tab-trigger-" + id).setAttribute("aria-selected", isActive ? "true" : "false");
      $("tab-panel-" + id).hidden = !isActive;
    });
  }

  function renderExcelPreview() {
    var tbody = $("preview-body");
    var rows = state.excel.rows;

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

  function renderExcelSummary() {
    $("file-name").textContent = state.excel.fileName;
    $("sheet-name").textContent = state.excel.sheetName;
    $("dataset-mode").textContent = state.excel.mode;
    $("total-rows").textContent = state.excel.summary.total;
    $("valid-rows").textContent = state.excel.summary.valid;
    $("error-rows").textContent = state.excel.summary.errors;
    $("status-pill").textContent = state.excel.statusPill;
    $("status-pill").className = "pill " + state.excel.statusPillClass;
    $("status-caption").textContent = state.excel.statusCaption;
    $("export-copy").textContent = state.excel.exportCopy;
    $("export-button").disabled = !state.excel.exportReady;
    $("open-errors-button").disabled = state.excel.errors.length === 0;
    $("validate-button").disabled = !state.file;
  }

  function renderS5Summary() {
    $("s5-preset-select").value = state.s5.preset;
    $("s5-preset-copy").textContent = EXPORT_PRESETS[state.s5.preset].pattern;
    if ($("s5-input").value !== state.s5.input) {
      $("s5-input").value = state.s5.input;
    }
    $("s5-total-rows").textContent = state.s5.summary.total;
    $("s5-valid-rows").textContent = state.s5.summary.valid;
    $("s5-error-rows").textContent = state.s5.summary.errors;
    $("s5-status-pill").textContent = state.s5.statusPill;
    $("s5-status-pill").className = "pill " + state.s5.statusPillClass;
    $("s5-status-caption").textContent = state.s5.statusCaption;
    if ($("s5-output").value !== state.s5.outputText) {
      $("s5-output").value = state.s5.outputText;
    }
    $("s5-copy-caption").textContent = state.s5.copyCaption;
    $("copy-s5-button").disabled = !state.s5.copyReady;
    $("open-errors-button-s5").disabled = state.s5.errors.length === 0;
  }

  function renderModal() {
    if (!state.modalErrors.length) {
      $("modal-title").textContent = "异常数据明细";
      $("modal-summary").textContent = "当前没有异常项。";
      $("modal-list").innerHTML =
        '<article class="modal-item"><strong>校验通过</strong><p>所有数据都符合当前导出格式要求。</p></article>';
      return;
    }

    $("modal-title").textContent = state.modalTitle;
    $("modal-summary").textContent =
      "本次共发现 " + state.modalErrors.length + " 条异常。请修正后重新执行。";
    $("modal-list").innerHTML = state.modalErrors
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
    setActiveTab(state.activeTab);
    renderExcelPreview();
    renderExcelSummary();
    renderS5Summary();
    renderModal();
  }

  function openModal(errors, title) {
    state.modalErrors = errors || [];
    state.modalTitle = title || "异常数据明细";
    renderModal();
    $("error-modal").hidden = false;
  }

  function closeModal() {
    $("error-modal").hidden = true;
  }

  function setFile(file) {
    state.file = file;
    state.excel = Object.assign({}, emptyExcelState, {
      fileName: file ? file.name : "未选择文件",
      mode: file ? "已选择文件" : "等待校验",
      statusCaption: file ? "点击开始校验读取真实 Excel" : emptyExcelState.statusCaption,
    });
    render();
  }

  function resetS5DerivedState(nextInput, nextPreset) {
    state.s5 = Object.assign({}, emptyS5State, {
      input: typeof nextInput === "string" ? nextInput : state.s5.input,
      preset: nextPreset || state.s5.preset,
    });
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

  function splitCredential(rawValue) {
    var value = normalizeCell(rawValue);
    var index = value.indexOf(":");

    if (index <= 0 || index === value.length - 1) {
      return null;
    }

    return {
      username: value.slice(0, index).trim(),
      password: value.slice(index + 1).trim(),
    };
  }

  function decodeBase64(rawValue) {
    var normalized = normalizeCell(rawValue).replace(/^base64\(/i, "").replace(/\)$/i, "");
    normalized = normalized.replace(/-/g, "+").replace(/_/g, "/");
    while (normalized.length % 4 !== 0) {
      normalized += "=";
    }

    try {
      return decodeURIComponent(
        Array.prototype.map
          .call(atob(normalized), function (char) {
            return "%" + ("00" + char.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );
    } catch (error) {
      try {
        return atob(normalized);
      } catch (fallbackError) {
        return null;
      }
    }
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
    var headerMap = collectHeaderMap(matrix[0] || []);
    var errors = buildHeaderErrors(headerMap);
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

    if (!errors.length) {
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
        var parsedProxy = splitHostPort(proxy);
        var host = parsedProxy ? parsedProxy.host : "";
        var port = parsedProxy ? parsedProxy.port : "";
        var rowErrors = [];

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
        } else if (Number(port) < 1 || Number(port) > 65535) {
          rowErrors.push("代理端口必须在 1-65535 之间");
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
      summary: { total: totalRows, valid: exportRows.length, errors: errors.length },
      rows: rows,
      errors: errors,
      exportReady: ok,
      exportRows: exportRows,
      statusPill: ok ? "校验已通过" : "导出已拦截",
      statusPillClass: ok ? "pill-success" : "pill-danger",
      statusCaption: ok ? "可以导出目标文件" : "请先修正异常数据",
      exportCopy: ok ? "proxysheet-export.xlsx 已准备好，当前状态允许导出。" : "当前存在异常数据，导出已锁定。",
    };
  }

  function parsePlainSocks5(line) {
    if (!/^socks5:\/\//i.test(line)) {
      return null;
    }

    var content = line.replace(/^socks5:\/\//i, "");
    var parts = content.split("#");
    var mainPart = parts.shift();
    var remark = parts.join("#");
    var atIndex = mainPart.lastIndexOf("@");

    if (atIndex <= 0) {
      return null;
    }

    var credentials = splitCredential(mainPart.slice(0, atIndex));
    var hostPort = splitHostPort(mainPart.slice(atIndex + 1));

    if (!credentials || !hostPort) {
      return null;
    }

    return {
      username: credentials.username,
      password: credentials.password,
      host: hostPort.host,
      port: hostPort.port,
      remark: remark,
      sourceFormat: "明文完整格式",
    };
  }

  function parseBase64Full(line) {
    if (!/^socks:\/\//i.test(line)) {
      return null;
    }

    var raw = line.replace(/^socks:\/\//i, "");
    var remark = "";
    var payload = raw;

    if (raw.indexOf("?remarks=") !== -1) {
      var queryParts = raw.split("?remarks=");
      payload = queryParts.shift();
      remark = queryParts.join("?remarks=");
    } else if (raw.indexOf("#") !== -1) {
      var fragmentParts = raw.split("#");
      payload = fragmentParts.shift();
      remark = fragmentParts.join("#");
    }

    var decoded = decodeBase64(payload);

    if (!decoded) {
      return null;
    }

    var atIndex = decoded.lastIndexOf("@");
    if (atIndex <= 0) {
      return null;
    }

    var credentials = splitCredential(decoded.slice(0, atIndex));
    var hostPort = splitHostPort(decoded.slice(atIndex + 1));

    if (!credentials || !hostPort) {
      return null;
    }

    return {
      username: credentials.username,
      password: credentials.password,
      host: hostPort.host,
      port: hostPort.port,
      remark: remark,
      sourceFormat: "Base64完整连接",
    };
  }

  function parseBase64Credentials(line) {
    if (!/^socks:\/\//i.test(line) || line.indexOf("@") === -1) {
      return null;
    }

    var raw = line.replace(/^socks:\/\//i, "");
    var parts = raw.split("#");
    var mainPart = parts.shift();
    var remark = parts.join("#");
    var atIndex = mainPart.lastIndexOf("@");
    var decoded = decodeBase64(mainPart.slice(0, atIndex));
    var hostPort = splitHostPort(mainPart.slice(atIndex + 1));

    if (!decoded || !hostPort) {
      return null;
    }

    var credentials = splitCredential(decoded);
    if (!credentials) {
      return null;
    }

    return {
      username: credentials.username,
      password: credentials.password,
      host: hostPort.host,
      port: hostPort.port,
      remark: remark,
      sourceFormat: "Base64账号密码",
    };
  }

  function validateParsedS5Row(parsed, rowNumber) {
    var rowErrors = [];

    if (!parsed.host) {
      rowErrors.push("缺少代理地址");
    }

    if (!parsed.port) {
      rowErrors.push("缺少代理端口");
    } else if (!/^\d+$/.test(parsed.port)) {
      rowErrors.push("代理端口必须为数字");
    } else if (Number(parsed.port) < 1 || Number(parsed.port) > 65535) {
      rowErrors.push("代理端口必须在 1-65535 之间");
    }

    if (!parsed.username) {
      rowErrors.push("缺少代理账号");
    }

    if (!parsed.password) {
      rowErrors.push("缺少代理密码");
    }

    if (!rowErrors.length) {
      return null;
    }

    return {
      row: rowNumber,
      scope: "第 " + rowNumber + " 行",
      message: rowErrors.join("；"),
    };
  }

  function parseS5Lines(inputText, preset) {
    var lines = inputText.split(/\r?\n/);
    var errors = [];
    var validRows = [];
    var totalRows = 0;

    lines.forEach(function (rawLine, index) {
      var line = normalizeCell(rawLine);

      if (!line) {
        return;
      }

      totalRows += 1;
      var rowNumber = index + 1;
      var parsed =
        parsePlainSocks5(line) ||
        parseBase64Full(line) ||
        parseBase64Credentials(line);

      if (!parsed) {
        errors.push({
          row: rowNumber,
          scope: "第 " + rowNumber + " 行",
          message: "无法识别 URL 格式或 Base64 解码失败",
        });
        return;
      }

      var validationError = validateParsedS5Row(parsed, rowNumber);
      if (validationError) {
        errors.push(validationError);
        return;
      }

      validRows.push({
        row: rowNumber,
        host: parsed.host,
        port: parsed.port,
        username: parsed.username,
        password: parsed.password,
        remark: parsed.remark || "",
        sourceFormat: parsed.sourceFormat,
        rawLine: line,
      });
    });

    if (!totalRows) {
      errors.push({
        row: 1,
        scope: "没有可解析的数据",
        message: "请先在左侧输入至少一条 S5 URL。",
      });
    }

    var ok = errors.length === 0 && validRows.length > 0;
    var outputText = ok
      ? validRows
          .map(function (row) {
            return EXPORT_PRESETS[preset].render(row);
          })
          .join("\n")
      : "";

    return {
      preset: preset,
      input: inputText,
      summary: {
        total: totalRows,
        valid: validRows.length,
        errors: errors.length,
      },
      rows: validRows,
      errors: errors,
      outputText: outputText,
      copyReady: ok,
      statusPill: ok ? "解析已通过" : "解析被拦截",
      statusPillClass: ok ? "pill-success" : "pill-danger",
      statusCaption: ok ? "多行配置已生成，可直接复制" : "请先修正异常 URL",
      copyCaption: ok
        ? "已生成 " + validRows.length + " 条结果，可一键复制全部并粘贴到其他平台。"
        : "当前存在异常 URL，复制已锁定。",
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

    setBusy("excel", true);

    try {
      var buffer = await state.file.arrayBuffer();
      var workbook = XLSX.read(buffer, { type: "array" });
      state.excel = validateWorkbook(state.file, workbook);
      render();

      if (!state.excel.exportReady && state.excel.errors.length) {
        openModal(state.excel.errors, "Excel 异常数据明细");
      }
    } catch (error) {
      alert("文件读取失败，请确认上传的是有效的 .xlsx 文件。");
    } finally {
      setBusy("excel", false);
    }
  }

  function exportFile() {
    if (!state.excel.exportReady) {
      alert("当前未通过校验，无法导出。");
      return;
    }

    if (!window.XLSX) {
      alert("Excel 导出库加载失败，请刷新页面后重试。");
      return;
    }

    setBusy("excel", true);

    try {
      var workbook = XLSX.utils.book_new();
      var sheetData = [TARGET_HEADERS].concat(state.excel.exportRows);
      var worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      XLSX.utils.book_append_sheet(workbook, worksheet, "代理导出");
      XLSX.writeFile(workbook, "proxysheet-export.xlsx");
    } catch (error) {
      alert("导出失败，请重新校验后再试。");
    } finally {
      setBusy("excel", false);
    }
  }

  function parseS5Input() {
    setBusy("s5", true);
    state.s5 = parseS5Lines($("s5-input").value, $("s5-preset-select").value);
    render();

    if (state.s5.errors.length) {
      openModal(state.s5.errors, "S5 URL 异常明细");
    }
    setBusy("s5", false);
  }

  async function copyS5Output() {
    if (!state.s5.copyReady || !state.s5.outputText) {
      alert("请先解析通过后再复制。");
      return;
    }

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(state.s5.outputText);
      } else {
        $("s5-output").focus();
        $("s5-output").select();
        document.execCommand("copy");
      }
      state.s5.copyCaption = "已复制 " + state.s5.summary.valid + " 条结果，每条配置已按换行分隔。";
      renderS5Summary();
    } catch (error) {
      alert("复制失败，请手动选中结果后复制。");
    }
  }

  function setBusy(scope, isBusy) {
    if (scope === "excel") {
      $("validate-button").disabled = isBusy || !state.file;
      $("export-button").disabled = isBusy || !state.excel.exportReady;
      $("clear-file-button").disabled = isBusy;
      $("upload-dropzone").disabled = isBusy;
      return;
    }

    $("parse-s5-button").disabled = isBusy;
    $("copy-s5-button").disabled = isBusy || !state.s5.copyReady;
    $("clear-s5-button").disabled = isBusy;
    $("s5-preset-select").disabled = isBusy;
    $("s5-input").disabled = isBusy;
  }

  function bindEvents() {
    TAB_IDS.forEach(function (id) {
      $("tab-trigger-" + id).addEventListener("click", function () {
        setActiveTab(id);
      });
    });

    $("s5-preset-select").addEventListener("change", function (event) {
      resetS5DerivedState(state.s5.input, event.target.value);
      render();
    });

    $("s5-input").addEventListener("input", function (event) {
      resetS5DerivedState(event.target.value, state.s5.preset);
      renderS5Summary();
    });

    $("parse-s5-button").addEventListener("click", parseS5Input);
    $("copy-s5-button").addEventListener("click", copyS5Output);
    $("clear-s5-button").addEventListener("click", function () {
      state.s5 = Object.assign({}, emptyS5State, { preset: $("s5-preset-select").value });
      closeModal();
      render();
    });

    $("open-errors-button-s5").addEventListener("click", function () {
      openModal(state.s5.errors, "S5 URL 异常明细");
    });

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
      openModal(state.excel.errors, "Excel 异常数据明细");
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
