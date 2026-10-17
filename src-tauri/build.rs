fn main() {
    // The app manifest requires administrator at launch: raw disk
    // access (\\.\PhysicalDriveX, NTFS MFT, BitLocker FVE) cannot work
    // unelevated. Windows shows the UAC consent prompt on open — the
    // product contract.
    let manifest = r#"
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <assemblyIdentity version="1.0.0.0" processorArchitecture="*" name="DiskWizard" type="win32"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v3">
    <security>
      <requestedPrivileges>
        <requestedExecutionLevel level="requireAdministrator" uiAccess="false"/>
      </requestedPrivileges>
    </security>
  </trustInfo>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e5f3f5e-2f55-4d61-8f0e-6d21f4e4f4c4}"/>
    </application>
  </compatibility>
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
        type="win32"
        name="Microsoft.Windows.Common-Controls"
        version="6.0.0.0"
        processorArchitecture="*"
        publicKeyToken="6595b64144ccf1df"
        language="*"
      />
    </dependentAssembly>
  </dependency>
</assembly>
"#;
    tauri_build::try_build(
        tauri_build::Attributes::new().windows_attributes(tauri_build::WindowsAttributes::new().app_manifest(manifest)),
    )
    .expect("failed to run tauri-build");
}
