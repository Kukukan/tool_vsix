export class BuildScriptTemplates {
  static readonly TEMPLATES = {
    node: {
      name: 'Node.js',
      script: `#!/bin/bash
set -e
echo "Building Node.js..."
npm install
npm run build
echo "Build complete!"`
    },
    python: {
      name: 'Python',
      script: `#!/bin/bash
set -e
echo "Building Python..."
python3 -m pip install -r requirements.txt
python3 setup.py build
echo "Build complete!"`
    },
    rust: {
      name: 'Rust (Cargo)',
      script: `#!/bin/bash
set -e
echo "Building Rust..."
cargo build --release
echo "Build complete!"`
    },
    go: {
      name: 'Go',
      script: `#!/bin/bash
set -e
echo "Building Go..."
go build -o app
echo "Build complete!"`
    },
    docker: {
      name: 'Docker',
      script: `#!/bin/bash
set -e
echo "Building Docker..."
docker build -t myapp:latest .
echo "Build complete!"`
    },
    make: {
      name: 'Make',
      script: `#!/bin/bash
set -e
echo "Building with Make..."
make clean
make build
echo "Build complete!"`
    },
    custom: {
      name: 'Custom',
      script: `#!/bin/bash
set -e
echo "Running custom build..."
echo "Build complete!"`
    }
  };

  static getTemplate(key: string): string | null {
    const template = this.TEMPLATES[key as keyof typeof this.TEMPLATES];
    return template ? template.script : null;
  }

  static getTemplateNames(): { key: string; name: string }[] {
    return Object.entries(this.TEMPLATES).map(([key, template]: [string, any]) => ({
      key,
      name: template.name
    }));
  }
}
