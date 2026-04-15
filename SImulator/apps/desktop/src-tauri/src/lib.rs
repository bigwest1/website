use std::env;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::process::Command;

use rusqlite::{params_from_iter, types::ValueRef, Connection};
use serde::{Deserialize, Serialize};
use serde_json::{json, Map, Value};

#[derive(Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ProjectBundleFile {
  relative_path: String,
  content: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct WriteProjectBundleResult {
  resolved_root_path: String,
  manifest_path: String,
  file_count: usize,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ReadProjectBundleResult {
  resolved_root_path: String,
  manifest_path: String,
  file_count: usize,
  files: Vec<ProjectBundleFile>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SqlRunResult {
  changes: usize,
  last_insert_row_id: Option<i64>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolPathProbeResult {
  exists: bool,
  executable: bool,
  summary: String,
  resolved_path: Option<String>,
  version_text: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct HostCommandStatus {
  command_id: String,
  available: bool,
  resolved_path: Option<String>,
  summary: String,
  version_text: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeRuntimeEvidence {
  check_id: String,
  label: String,
  status: String,
  detail: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct NativeRuntimeStatus {
  shell_runtime: String,
  os: String,
  desktop_runtime_available: bool,
  native_command_bridge_available: bool,
  filesystem_write_available: bool,
  sqlite_index_available: bool,
  command_execution_ready: bool,
  host_session_ready: bool,
  sqlite_path: Option<String>,
  project_root_resolved: Option<String>,
  writable_state_root: Option<String>,
  host_session_evidence_path: Option<String>,
  command_statuses: Vec<HostCommandStatus>,
  verification_evidence: Vec<NativeRuntimeEvidence>,
  degraded_reasons: Vec<String>,
  summary: String,
}

fn expand_project_root(project_root: &str) -> Result<PathBuf, String> {
  if project_root == "~" {
    return env::var("HOME")
      .map(PathBuf::from)
      .map_err(|_| "Could not resolve the home directory for '~'.".to_string());
  }

  if let Some(suffix) = project_root.strip_prefix("~/") {
    let home = env::var("HOME")
      .map_err(|_| "Could not resolve the home directory for '~/...'.".to_string())?;
    return Ok(PathBuf::from(home).join(suffix));
  }

  if let Some(suffix) = project_root.strip_prefix("~\\") {
    let home = env::var("HOME")
      .map_err(|_| "Could not resolve the home directory for '~\\...'.".to_string())?;
    return Ok(PathBuf::from(home).join(suffix));
  }

  Ok(PathBuf::from(project_root))
}

fn looks_like_path_reference(reference: &str) -> bool {
  reference.starts_with("~/")
    || reference.starts_with("~\\")
    || reference.starts_with("./")
    || reference.starts_with(".\\")
    || reference.starts_with("../")
    || reference.starts_with("..\\")
    || reference.starts_with('/')
    || reference.starts_with('\\')
    || reference.contains(std::path::MAIN_SEPARATOR)
}

fn resolve_executable_reference(reference: &str) -> Result<(PathBuf, bool), String> {
  let trimmed = reference.trim();
  if trimmed.is_empty() {
    return Err("Executable reference is empty.".to_string());
  }

  if looks_like_path_reference(trimmed) {
    return expand_project_root(trimmed).map(|path| (path, false));
  }

  if let Some(resolved) = resolve_command_in_path(trimmed) {
    return Ok((resolved, true));
  }

  Ok((PathBuf::from(trimmed), false))
}

fn is_safe_relative_path(relative_path: &str) -> bool {
  let path = Path::new(relative_path);

  !path.is_absolute()
    && path.components().all(|component| {
      matches!(component, Component::CurDir | Component::Normal(_))
    })
}

fn normalize_relative_path(path: &Path) -> String {
  path
    .components()
    .filter_map(|component| match component {
      Component::Normal(value) => Some(value.to_string_lossy().to_string()),
      _ => None,
    })
    .collect::<Vec<_>>()
    .join("/")
}

fn sqlite_db_path(project_root: &str) -> Result<PathBuf, String> {
  let resolved_root_path = expand_project_root(project_root.trim())?;
  Ok(resolved_root_path
    .join(".course-creator-os")
    .join("project-index.sqlite3"))
}

fn resolve_command_in_path(command_name: &str) -> Option<PathBuf> {
  let path = env::var_os("PATH")?;

  for directory in env::split_paths(&path) {
    let candidate = directory.join(command_name);
    if candidate.is_file() {
      return Some(candidate);
    }

    #[cfg(target_os = "windows")]
    {
      for extension in ["exe", "cmd", "bat"] {
        let windows_candidate = directory.join(format!("{}.{}", command_name, extension));
        if windows_candidate.is_file() {
          return Some(windows_candidate);
        }
      }
    }
  }

  None
}

fn run_command_capture(command_path: &Path, args: &[String], working_directory: Option<&Path>) -> Result<(bool, Option<i32>, String, String), String> {
  let mut command = Command::new(command_path);
  command.args(args);

  if let Some(directory) = working_directory {
    command.current_dir(directory);
  }

  let output = command.output().map_err(|error| {
    format!(
      "Failed to execute {}: {}",
      command_path.display(),
      error
    )
  })?;

  Ok((
    output.status.success(),
    output.status.code(),
    String::from_utf8_lossy(&output.stdout).trim().to_string(),
    String::from_utf8_lossy(&output.stderr).trim().to_string(),
  ))
}

fn verify_writable_directory(path: &Path) -> bool {
  if fs::create_dir_all(path).is_err() {
    return false;
  }

  let probe_path = path.join(".cco-native-write-test");
  let write_result = fs::write(&probe_path, "ok");
  let cleanup_result = fs::remove_file(&probe_path);

  write_result.is_ok() && cleanup_result.is_ok()
}

fn verify_existing_directory_write(path: &Path) -> bool {
  if !path.exists() || !path.is_dir() {
    return false;
  }

  let probe_path = path.join(".cco-project-write-test");
  let write_result = fs::write(&probe_path, "ok");
  let cleanup_result = fs::remove_file(&probe_path);

  write_result.is_ok() && cleanup_result.is_ok()
}

fn write_host_session_evidence(state_root: &Path) -> Result<PathBuf, String> {
  fs::create_dir_all(state_root).map_err(|error| {
    format!(
      "Failed to prepare {} for native host-session evidence: {}",
      state_root.display(),
      error
    )
  })?;

  let evidence_path = state_root.join("native-host-session-evidence.json");
  let evidence_payload = json!({
    "capturedAt": chrono_like_now_string(),
    "os": env::consts::OS,
    "pid": std::process::id(),
    "kind": "native-host-session"
  });

  let encoded = serde_json::to_string_pretty(&evidence_payload)
    .map_err(|error| format!("Failed to encode native host-session evidence: {}", error))?;

  fs::write(&evidence_path, encoded).map_err(|error| {
    format!(
      "Failed to write native host-session evidence at {}: {}",
      evidence_path.display(),
      error
    )
  })?;

  Ok(evidence_path)
}

fn chrono_like_now_string() -> String {
  match std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH) {
    Ok(duration) => format!("unix-{}", duration.as_secs()),
    Err(_) => "unix-0".to_string(),
  }
}

fn build_host_command_status(command_id: &str) -> HostCommandStatus {
  let resolved = resolve_command_in_path(command_id);

  if let Some(path) = resolved {
    let version_args = vec!["--version".to_string()];
    let version_probe = run_command_capture(&path, &version_args, None);
    let (summary, version_text) = match version_probe {
      Ok((success, _, stdout, stderr)) if success => {
        let version = if stdout.is_empty() { stderr } else { stdout };
        (
          format!("{} is available at {}.", command_id, path.display()),
          if version.is_empty() { None } else { Some(version) }
        )
      }
      Ok((_, _, _, stderr)) => (
        format!("{} was found at {}, but '--version' did not complete cleanly.", command_id, path.display()),
        if stderr.is_empty() { None } else { Some(stderr) }
      ),
      Err(error) => (
        format!("{} was found at {}, but version probing failed: {}", command_id, path.display(), error),
        None
      )
    };

    HostCommandStatus {
      command_id: command_id.to_string(),
      available: true,
      resolved_path: Some(path.display().to_string()),
      summary,
      version_text,
    }
  } else {
    HostCommandStatus {
      command_id: command_id.to_string(),
      available: false,
      resolved_path: None,
      summary: format!("{} was not found on PATH.", command_id),
      version_text: None,
    }
  }
}

fn build_runtime_evidence(
  check_id: &str,
  label: &str,
  status: &str,
  detail: String,
) -> NativeRuntimeEvidence {
  NativeRuntimeEvidence {
    check_id: check_id.to_string(),
    label: label.to_string(),
    status: status.to_string(),
    detail,
  }
}

fn verify_sqlite_runtime_roundtrip(project_root: &str) -> Result<(), String> {
  let connection = open_sqlite_connection(project_root)?;
  connection
    .execute_batch(
      "CREATE TEMP TABLE IF NOT EXISTS cco_runtime_probe (value TEXT);
       INSERT INTO cco_runtime_probe (value) VALUES ('ok');
       DELETE FROM cco_runtime_probe;",
    )
    .map_err(|error| format!("Failed SQLite roundtrip probe: {}", error))
}

fn verify_command_execution_roundtrip(command_status: &HostCommandStatus) -> Result<String, String> {
  let resolved_path = command_status
    .resolved_path
    .as_ref()
    .ok_or_else(|| format!("{} is not available on PATH.", command_status.command_id))?;
  let command_path = PathBuf::from(resolved_path);
  let args = vec![
    "-e".to_string(),
    "process.stdout.write('cco-host-probe')".to_string(),
  ];
  let (success, _, stdout, stderr) = run_command_capture(&command_path, &args, None)?;

  if success && stdout == "cco-host-probe" {
    Ok("Command execution roundtrip succeeded through the native bridge.".to_string())
  } else if success {
    Err(format!(
      "Command execution roundtrip returned unexpected output '{}'.",
      stdout
    ))
  } else {
    Err(format!(
      "Command execution roundtrip failed: {}",
      if stderr.is_empty() {
        "command exited unsuccessfully".to_string()
      } else {
        stderr
      }
    ))
  }
}

fn open_sqlite_connection(project_root: &str) -> Result<Connection, String> {
  let sqlite_path = sqlite_db_path(project_root)?;

  if let Some(parent) = sqlite_path.parent() {
    fs::create_dir_all(parent).map_err(|error| {
      format!(
        "Failed to create {} while preparing the SQLite index: {}",
        parent.display(),
        error
      )
    })?;
  }

  Connection::open(&sqlite_path).map_err(|error| {
    format!(
      "Failed to open the SQLite index at {}: {}",
      sqlite_path.display(),
      error
    )
  })
}

fn json_value_to_sql_value(value: &Value) -> Result<rusqlite::types::Value, String> {
  match value {
    Value::Null => Ok(rusqlite::types::Value::Null),
    Value::Bool(boolean) => Ok(rusqlite::types::Value::Integer(if *boolean { 1 } else { 0 })),
    Value::Number(number) => {
      if let Some(integer) = number.as_i64() {
        Ok(rusqlite::types::Value::Integer(integer))
      } else if let Some(float) = number.as_f64() {
        Ok(rusqlite::types::Value::Real(float))
      } else {
        Err("SQLite parameters must be strings, numbers, booleans, or null.".to_string())
      }
    }
    Value::String(text) => Ok(rusqlite::types::Value::Text(text.clone())),
    Value::Array(_) | Value::Object(_) => Err(
      "SQLite parameters cannot contain nested arrays or objects.".to_string(),
    ),
  }
}

fn sql_value_ref_to_json(value: ValueRef<'_>) -> Result<Value, String> {
  match value {
    ValueRef::Null => Ok(Value::Null),
    ValueRef::Integer(integer) => Ok(Value::from(integer)),
    ValueRef::Real(float) => Ok(Value::from(float)),
    ValueRef::Text(text) => Ok(Value::String(String::from_utf8_lossy(text).to_string())),
    ValueRef::Blob(_) => Err("Blob values are not supported by the desktop SQLite bridge.".to_string()),
  }
}

fn write_project_files(
  resolved_root_path: &Path,
  files: &[ProjectBundleFile],
  allow_overwrite: bool,
) -> Result<(), String> {
  let manifest_path = resolved_root_path.join("project.manifest.json");

  if !allow_overwrite && manifest_path.exists() {
    return Err(format!(
      "A Course Creator OS project already exists at {}.",
      manifest_path.display()
    ));
  }

  fs::create_dir_all(resolved_root_path).map_err(|error| {
    format!(
      "Failed to create the project root at {}: {}",
      resolved_root_path.display(),
      error
    )
  })?;

  for file in files {
    if !is_safe_relative_path(&file.relative_path) {
      return Err(format!(
        "Refused to write an unsafe relative path: {}",
        file.relative_path
      ));
    }

    let destination = resolved_root_path.join(&file.relative_path);

    if let Some(parent) = destination.parent() {
      fs::create_dir_all(parent).map_err(|error| {
        format!(
          "Failed to create {} while scaffolding the project: {}",
          parent.display(),
          error
        )
      })?;
    }

    fs::write(&destination, &file.content).map_err(|error| {
      format!("Failed to write {}: {}", destination.display(), error)
    })?;
  }

  Ok(())
}

fn collect_project_bundle_files(
  root_path: &Path,
  current_path: &Path,
  files: &mut Vec<ProjectBundleFile>,
) -> Result<(), String> {
  let entries = fs::read_dir(current_path).map_err(|error| {
    format!(
      "Failed to read {} while loading the project bundle: {}",
      current_path.display(),
      error
    )
  })?;

  for entry in entries {
    let entry = entry.map_err(|error| {
      format!(
        "Failed to iterate {} while loading the project bundle: {}",
        current_path.display(),
        error
      )
    })?;
    let entry_path = entry.path();

    if entry_path.is_dir() {
      collect_project_bundle_files(root_path, &entry_path, files)?;
      continue;
    }

    if entry_path
      .extension()
      .and_then(|value| value.to_str())
      .is_some_and(|extension| extension.eq_ignore_ascii_case("sqlite3"))
    {
      continue;
    }

    let content = fs::read_to_string(&entry_path).map_err(|error| {
      format!(
        "Failed to read {} while loading the project bundle: {}",
        entry_path.display(),
        error
      )
    })?;
    let relative_path = entry_path.strip_prefix(root_path).map_err(|error| {
      format!(
        "Failed to derive a relative path for {}: {}",
        entry_path.display(),
        error
      )
    })?;

    files.push(ProjectBundleFile {
      relative_path: normalize_relative_path(relative_path),
      content,
    });
  }

  Ok(())
}

fn write_generated_files(
  resolved_root_path: &Path,
  files: &[ProjectBundleFile],
) -> Result<(), String> {
  fs::create_dir_all(resolved_root_path).map_err(|error| {
    format!(
      "Failed to create the project root at {} while writing generated artifacts: {}",
      resolved_root_path.display(),
      error
    )
  })?;

  for file in files {
    if !is_safe_relative_path(&file.relative_path) {
      return Err(format!(
        "Refused to write an unsafe generated-artifact path: {}",
        file.relative_path
      ));
    }

    let destination = resolved_root_path.join(&file.relative_path);

    if let Some(parent) = destination.parent() {
      fs::create_dir_all(parent).map_err(|error| {
        format!(
          "Failed to create {} while writing generated artifacts: {}",
          parent.display(),
          error
        )
      })?;
    }

    fs::write(&destination, &file.content).map_err(|error| {
      format!(
        "Failed to write generated artifact {}: {}",
        destination.display(),
        error
      )
    })?;
  }

  Ok(())
}

#[tauri::command]
fn write_project_bundle(
  project_root: String,
  files: Vec<ProjectBundleFile>,
) -> Result<WriteProjectBundleResult, String> {
  let resolved_root_path = expand_project_root(project_root.trim())?;
  let manifest_path = resolved_root_path.join("project.manifest.json");

  write_project_files(&resolved_root_path, &files, false)?;

  Ok(WriteProjectBundleResult {
    resolved_root_path: resolved_root_path.display().to_string(),
    manifest_path: manifest_path.display().to_string(),
    file_count: files.len(),
  })
}

#[tauri::command]
fn save_project_bundle(
  project_root: String,
  files: Vec<ProjectBundleFile>,
) -> Result<WriteProjectBundleResult, String> {
  let resolved_root_path = expand_project_root(project_root.trim())?;
  let manifest_path = resolved_root_path.join("project.manifest.json");

  write_project_files(&resolved_root_path, &files, true)?;

  Ok(WriteProjectBundleResult {
    resolved_root_path: resolved_root_path.display().to_string(),
    manifest_path: manifest_path.display().to_string(),
    file_count: files.len(),
  })
}

#[tauri::command]
fn read_project_bundle(project_root: String) -> Result<ReadProjectBundleResult, String> {
  let resolved_root_path = expand_project_root(project_root.trim())?;
  let manifest_path = resolved_root_path.join("project.manifest.json");

  if !manifest_path.exists() {
    return Err(format!(
      "No Course Creator OS manifest was found at {}.",
      manifest_path.display()
    ));
  }

  let mut files = Vec::new();
  collect_project_bundle_files(&resolved_root_path, &resolved_root_path, &mut files)?;
  files.sort_by(|left, right| left.relative_path.cmp(&right.relative_path));

  Ok(ReadProjectBundleResult {
    resolved_root_path: resolved_root_path.display().to_string(),
    manifest_path: manifest_path.display().to_string(),
    file_count: files.len(),
    files,
  })
}

#[tauri::command]
fn write_generated_artifacts(
  project_root: String,
  files: Vec<ProjectBundleFile>,
) -> Result<WriteProjectBundleResult, String> {
  let resolved_root_path = expand_project_root(project_root.trim())?;
  let manifest_path = resolved_root_path.join("project.manifest.json");

  write_generated_files(&resolved_root_path, &files)?;

  Ok(WriteProjectBundleResult {
    resolved_root_path: resolved_root_path.display().to_string(),
    manifest_path: manifest_path.display().to_string(),
    file_count: files.len(),
  })
}

#[tauri::command]
fn probe_tool_path(path: String) -> Result<ToolPathProbeResult, String> {
  probe_tool_path_with_args(path, vec!["--version".to_string()])
}

#[tauri::command]
fn probe_tool_path_with_args(path: String, version_args: Vec<String>) -> Result<ToolPathProbeResult, String> {
  let trimmed = path.trim();
  if trimmed.is_empty() {
    return Ok(ToolPathProbeResult {
      exists: false,
      executable: false,
      summary: "No executable path is configured yet.".to_string(),
      resolved_path: None,
      version_text: None,
    });
  }

  let (resolved, resolved_from_path_lookup) = resolve_executable_reference(trimmed)?;
  let exists = resolved.exists();
  let executable = exists && resolved.is_file();
  let version_text = if executable {
    match run_command_capture(&resolved, &version_args, None) {
      Ok((success, _, stdout, stderr)) if success => {
        let version_output = if stdout.is_empty() { stderr } else { stdout };
        if version_output.is_empty() { None } else { Some(version_output) }
      }
      _ => None,
    }
  } else {
    None
  };

  Ok(ToolPathProbeResult {
    exists,
    executable,
    summary: if exists && executable {
      if resolved_from_path_lookup {
        format!("Verified executable '{}' on PATH at {}.", trimmed, resolved.display())
      } else {
        format!("Verified executable path at {}.", resolved.display())
      }
    } else if exists {
      format!(
        "Path exists at {}, but it is not a file-like executable target.",
        resolved.display()
      )
    } else if !looks_like_path_reference(trimmed) {
      format!("Command '{}' was not found on PATH.", trimmed)
    } else {
      format!("Path was not found at {}.", resolved.display())
    },
    resolved_path: Some(resolved.display().to_string()),
    version_text,
  })
}

#[tauri::command]
fn get_native_runtime_status(project_root: Option<String>) -> Result<NativeRuntimeStatus, String> {
  let resolved_root = match project_root {
    Some(root) if !root.trim().is_empty() => Some(expand_project_root(root.trim())?),
    _ => None,
  };
  let writable_state_root = resolved_root
    .as_ref()
    .map(|root| root.join(".course-creator-os"));
  let sqlite_path = writable_state_root
    .as_ref()
    .map(|root| root.join("project-index.sqlite3"));
  let project_root_write_available = resolved_root
    .as_ref()
    .map(|root| verify_existing_directory_write(root))
    .unwrap_or(false);
  let state_root_write_available = writable_state_root
    .as_ref()
    .map(|root| verify_writable_directory(root))
    .unwrap_or(false);
  let filesystem_write_available = project_root_write_available && state_root_write_available;
  let sqlite_roundtrip_error = resolved_root
    .as_ref()
    .filter(|_| filesystem_write_available)
    .map(|root| {
      let root_string = root.display().to_string();
      verify_sqlite_runtime_roundtrip(&root_string).err()
    })
    .flatten();
  let (host_session_ready, host_session_evidence_path, host_session_error) = match writable_state_root.as_ref() {
    Some(root) if state_root_write_available => match write_host_session_evidence(root) {
      Ok(path) => (true, Some(path.display().to_string()), None),
      Err(error) => (false, None, Some(error)),
    },
    Some(root) => (
      false,
      None,
      Some(format!(
        "Native host-session evidence could not be written because {} is not writable.",
        root.display()
      )),
    ),
    None => (
      false,
      None,
      Some("Native host-session evidence could not be captured because no persisted project root was supplied.".to_string()),
    ),
  };
  let sqlite_index_available =
    resolved_root.is_some() && filesystem_write_available && sqlite_roundtrip_error.is_none();
  let command_statuses = vec![
    build_host_command_status("cargo"),
    build_host_command_status("rustc"),
    build_host_command_status("node"),
    build_host_command_status("npm"),
    build_host_command_status("sqlite3"),
    build_host_command_status("tauri"),
  ];
  let native_command_bridge_available = true;
  let desktop_runtime_available = true;
  let cargo_available = command_statuses
    .iter()
    .find(|status| status.command_id == "cargo")
    .is_some_and(|status| status.available);
  let rustc_available = command_statuses
    .iter()
    .find(|status| status.command_id == "rustc")
    .is_some_and(|status| status.available);
  let tauri_available = command_statuses
    .iter()
    .find(|status| status.command_id == "tauri")
    .is_some_and(|status| status.available);
  let node_available = command_statuses
    .iter()
    .find(|status| status.command_id == "node")
    .is_some_and(|status| status.available);
  let npm_available = command_statuses
    .iter()
    .find(|status| status.command_id == "npm")
    .is_some_and(|status| status.available);
  let sqlite_cli_available = command_statuses
    .iter()
    .find(|status| status.command_id == "sqlite3")
    .is_some_and(|status| status.available);
  let command_roundtrip_error = command_statuses
    .iter()
    .find(|status| status.command_id == "node" && status.available)
    .and_then(|status| verify_command_execution_roundtrip(status).err());
  let command_roundtrip_detail = if command_roundtrip_error.is_none() && node_available {
    Some("Command execution roundtrip succeeded through the native bridge.".to_string())
  } else {
    None
  };
  let command_execution_ready =
    node_available && npm_available && command_roundtrip_error.is_none();
  let mut verification_evidence = vec![
    build_runtime_evidence(
      "desktop-runtime",
      "Desktop runtime bridge",
      "verified",
      "Tauri host shell is available for native command routing.".to_string(),
    ),
    build_runtime_evidence(
      "project-root",
      "Persisted project root",
      if resolved_root.is_some() { "verified" } else { "partial" },
      match resolved_root.as_ref() {
        Some(path) => format!("Project root resolved at {}.", path.display()),
        None => "No persisted project root was provided for host verification.".to_string(),
      },
    ),
    build_runtime_evidence(
      "filesystem-write",
      "Project-root write posture",
      if project_root_write_available { "verified" } else { "failed" },
      match resolved_root.as_ref() {
        Some(path) if project_root_write_available => {
          format!("Write probe succeeded inside persisted project root {}.", path.display())
        }
        Some(path) => format!(
          "Write probe failed inside persisted project root {}.",
          path.display()
        ),
        None => "Project-root write verification could not run because no persisted project root was supplied.".to_string(),
      },
    ),
    build_runtime_evidence(
      "filesystem-state-root-write",
      "State-root write posture",
      if state_root_write_available { "verified" } else { "failed" },
      match writable_state_root.as_ref() {
        Some(path) if state_root_write_available => {
          format!("Write probe succeeded inside runtime state root {}.", path.display())
        }
        Some(path) => format!("Write probe failed inside runtime state root {}.", path.display()),
        None => "State-root write verification could not run because no persisted project root was supplied.".to_string(),
      },
    ),
    build_runtime_evidence(
      "host-session",
      "Native host session",
      if host_session_ready { "verified" } else { "partial" },
      if host_session_ready {
        format!(
          "Live native host-session evidence was written at {}.",
          host_session_evidence_path.clone().unwrap_or_default()
        )
      } else {
        host_session_error
          .clone()
          .unwrap_or_else(|| "Native host-session evidence was not captured.".to_string())
      },
    ),
    build_runtime_evidence(
      "sqlite-runtime",
      "SQLite runtime posture",
      if sqlite_index_available { "verified" } else if resolved_root.is_some() { "partial" } else { "failed" },
      match sqlite_path.as_ref() {
        Some(path) if sqlite_index_available => {
          format!("SQLite probe succeeded at {}.", path.display())
        }
        Some(path) if sqlite_roundtrip_error.is_some() => format!(
          "SQLite probe reached {}, but the roundtrip failed: {}",
          path.display(),
          sqlite_roundtrip_error.clone().unwrap_or_default()
        ),
        Some(path) => format!("SQLite probe could not complete at {}.", path.display()),
        None => "SQLite probe could not run because no persisted project root was supplied.".to_string(),
      },
    ),
    build_runtime_evidence(
      "command-execution",
      "Host command execution posture",
      if command_execution_ready { "verified" } else { "partial" },
      if command_execution_ready {
        "Node and npm are available, and a native command roundtrip succeeded.".to_string()
      } else {
        "Node or npm is missing, or command roundtrip execution failed through the native bridge.".to_string()
      },
    ),
  ];
  verification_evidence.push(build_runtime_evidence(
    "command-roundtrip",
    "Command execution roundtrip",
    if command_roundtrip_detail.is_some() { "verified" } else { "failed" },
    command_roundtrip_detail
      .clone()
      .unwrap_or_else(|| {
        command_roundtrip_error
          .clone()
          .unwrap_or_else(|| "Native command roundtrip did not complete cleanly.".to_string())
      }),
  ));
  verification_evidence.push(build_runtime_evidence(
    "sqlite-cli",
    "SQLite command-line tool",
    if sqlite_cli_available { "verified" } else { "partial" },
    if sqlite_cli_available {
      "sqlite3 is available on PATH for deeper host-side inspection and support workflows.".to_string()
    } else {
      "sqlite3 is not available on PATH, so host-side inspection is relying on embedded SQLite only.".to_string()
    },
  ));
  verification_evidence.push(build_runtime_evidence(
    "native-toolchain",
    "Native Rust/Tauri toolchain",
    if cargo_available && rustc_available && tauri_available {
      "verified"
    } else {
      "partial"
    },
    if cargo_available && rustc_available && tauri_available {
      "Cargo, rustc, and tauri are present on PATH.".to_string()
    } else {
      "Cargo, rustc, or tauri is still missing on PATH.".to_string()
    },
  ));
  let mut degraded_reasons = Vec::new();

  if resolved_root.is_none() {
    degraded_reasons.push("No persisted project root was supplied for host verification.".to_string());
  }

  if !project_root_write_available {
    degraded_reasons.push("Persisted project root is not writable through the native host.".to_string());
  }

  if !state_root_write_available {
    degraded_reasons.push("Runtime state-root write verification did not complete cleanly.".to_string());
  }

  if !sqlite_index_available {
    degraded_reasons.push(
      sqlite_roundtrip_error
        .clone()
        .unwrap_or_else(|| "SQLite readiness roundtrip could not be verified against the persisted project root.".to_string())
    );
  }

  if !host_session_ready {
    degraded_reasons.push(
      host_session_error
        .clone()
        .unwrap_or_else(|| "Native host-session evidence could not be captured.".to_string())
    );
  }

  if !command_execution_ready {
    degraded_reasons.push(
      command_roundtrip_error
        .clone()
        .unwrap_or_else(|| "Node or npm is missing, or the native command roundtrip failed.".to_string())
    );
  }

  if !(cargo_available && rustc_available && tauri_available) {
    degraded_reasons.push("Cargo, rustc, or tauri is missing on PATH.".to_string());
  }

  Ok(NativeRuntimeStatus {
    shell_runtime: "tauri".to_string(),
    os: env::consts::OS.to_string(),
    desktop_runtime_available,
    native_command_bridge_available,
    filesystem_write_available,
    sqlite_index_available,
    command_execution_ready,
    host_session_ready,
    sqlite_path: sqlite_path.map(|path| path.display().to_string()),
    project_root_resolved: resolved_root.map(|path| path.display().to_string()),
    writable_state_root: writable_state_root.map(|path| path.display().to_string()),
    host_session_evidence_path,
    command_statuses,
    verification_evidence,
    degraded_reasons,
    summary: if sqlite_index_available
      && filesystem_write_available
      && host_session_ready
      && command_execution_ready
      && cargo_available
      && rustc_available
      && tauri_available
    {
      "Native shell detected, live host-session evidence was captured, project-root and state-root writes succeeded, SQLite is operational, and host runtime commands are available.".to_string()
    } else if resolved_root.is_some() && project_root_write_available && state_root_write_available {
      "Native shell detected and host writes succeeded, but live host-session evidence, SQLite roundtrip, command execution roundtrip, or host runtime prerequisites are still incomplete.".to_string()
    } else {
      "Native shell detected, but persisted project-root or runtime state-root verification did not complete cleanly.".to_string()
    },
  })
}

#[tauri::command]
fn run_native_command(
  command_path: String,
  args: Vec<String>,
  working_directory: Option<String>,
) -> Result<Value, String> {
  let (resolved, _) = resolve_executable_reference(command_path.trim())?;
  let working_directory = match working_directory {
    Some(directory) if !directory.trim().is_empty() => Some(expand_project_root(directory.trim())?),
    _ => None,
  };
  let (success, exit_code, stdout, stderr) =
    run_command_capture(&resolved, &args, working_directory.as_deref())?;

  Ok(Value::Object(
    Map::from_iter([
      ("success".to_string(), Value::Bool(success)),
      (
        "exitCode".to_string(),
        exit_code.map(Value::from).unwrap_or(Value::Null),
      ),
      (
        "summary".to_string(),
        Value::String(if success {
          format!("Executed {} successfully.", resolved.display())
        } else {
          format!("Execution failed for {}.", resolved.display())
        }),
      ),
      (
        "commandLine".to_string(),
        Value::String(
          std::iter::once(resolved.display().to_string())
            .chain(args.iter().cloned())
            .collect::<Vec<_>>()
            .join(" "),
        ),
      ),
      ("stdout".to_string(), Value::String(stdout)),
      ("stderr".to_string(), Value::String(stderr)),
    ]),
  ))
}

#[tauri::command]
fn sqlite_exec(project_root: String, sql: String) -> Result<(), String> {
  let connection = open_sqlite_connection(&project_root)?;
  connection
    .execute_batch(&sql)
    .map_err(|error| format!("Failed to execute SQLite batch operation: {}", error))
}

#[tauri::command]
fn sqlite_run(
  project_root: String,
  sql: String,
  params: Vec<Value>,
) -> Result<SqlRunResult, String> {
  let connection = open_sqlite_connection(&project_root)?;
  let sqlite_params = params
    .iter()
    .map(json_value_to_sql_value)
    .collect::<Result<Vec<_>, _>>()?;
  let changes = connection
    .execute(&sql, params_from_iter(sqlite_params))
    .map_err(|error| format!("Failed to execute SQLite write operation: {}", error))?;
  let last_insert_row_id = connection.last_insert_rowid();

  Ok(SqlRunResult {
    changes,
    last_insert_row_id: if last_insert_row_id > 0 {
      Some(last_insert_row_id)
    } else {
      None
    },
  })
}

#[tauri::command]
fn sqlite_query(
  project_root: String,
  sql: String,
  params: Vec<Value>,
) -> Result<Vec<Map<String, Value>>, String> {
  let connection = open_sqlite_connection(&project_root)?;
  let sqlite_params = params
    .iter()
    .map(json_value_to_sql_value)
    .collect::<Result<Vec<_>, _>>()?;
  let mut statement = connection
    .prepare(&sql)
    .map_err(|error| format!("Failed to prepare SQLite query: {}", error))?;
  let column_names = statement
    .column_names()
    .iter()
    .map(|name| name.to_string())
    .collect::<Vec<_>>();
  let mut rows = statement
    .query(params_from_iter(sqlite_params))
    .map_err(|error| format!("Failed to execute SQLite query: {}", error))?;
  let mut results = Vec::new();

  while let Some(row) = rows
    .next()
    .map_err(|error| format!("Failed to iterate SQLite query rows: {}", error))?
  {
    let mut entry = Map::new();

    for (index, column_name) in column_names.iter().enumerate() {
      let value = row
        .get_ref(index)
        .map_err(|error| format!("Failed to read SQLite column '{}': {}", column_name, error))?;
      entry.insert(column_name.clone(), sql_value_ref_to_json(value)?);
    }

    results.push(entry);
  }

  Ok(results)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
      write_project_bundle,
      save_project_bundle,
      read_project_bundle,
      write_generated_artifacts,
      probe_tool_path,
      probe_tool_path_with_args,
      get_native_runtime_status,
      run_native_command,
      sqlite_exec,
      sqlite_run,
      sqlite_query
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
