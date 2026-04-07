import * as SerialPort from 'serialport';
import { PortInfo } from '@serialport/bindings-interface';

/**
 * Manages COM port detection and selection for Flash mode
 */
export class ComPortManager {
  /**
   * Get list of available COM ports on the system
   * @returns Promise resolving to array of port info objects with path and description
   */
  static async getAvailablePorts(): Promise<PortInfo[]> {
    try {
      const ports = await SerialPort.SerialPort.list();
      return ports.filter(port => port.path); // Filter out any without a path
    } catch (error) {
      console.error('Error listing COM ports:', error);
      return [];
    }
  }

  /**
   * Format port information for display
   * @param port Port info object
   * @returns Formatted string for display
   */
  static formatPortForDisplay(port: PortInfo): string {
    const description = port.manufacturer ? ` (${port.manufacturer})` : '';
    return `${port.path}${description}`;
  }

  /**
   * Get port display name from path
   * @param path COM port path (e.g., COM3, /dev/ttyUSB0)
   * @returns Display name
   */
  static getPortDisplayName(path: string): string {
    if (path.includes('COM')) {
      // Windows COM port
      const match = path.match(/COM\d+/);
      return match ? match[0] : path;
    }
    // Unix/Linux port
    return path.split('/').pop() || path;
  }
}
