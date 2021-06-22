import {
  Buffer,
  Entity,
  VertexElement,
  VertexElementFormat,
  BufferBindFlag,
  IndexFormat,
  BufferUsage,
  MeshRenderer,
  BufferMesh,
} from 'oasis-engine';
import { SkeletonMaterial } from './LottieMaterial';

/**
 * @internal
 */
export class MeshBatcher extends MeshRenderer {
  vertices: Float32Array;
  indices: Uint16Array;
  vertexBuffer: Buffer;

  private indexBuffer: Buffer;
  private verticesLength = 0;
  private indicesLength = 0;

  constructor(entity: Entity) {
    super(entity);
  }

  init(l: number): void {
    const mesh = new BufferMesh(this.engine, 'lottie_batch_mesh');

    this.vertices = new Float32Array(36 * l);
    this.indicesLength = 6 * l;
    this.indices = new Uint16Array(6 * l);

    const vertexElements = [
      new VertexElement('POSITION', 0, VertexElementFormat.Vector3, 0),
      new VertexElement('COLOR_0', 12, VertexElementFormat.Vector4, 0),
      new VertexElement('TEXCOORD_0', 28, VertexElementFormat.Vector2, 0),
    ];

    const vertexStride = 36
    const byteLength = vertexStride * l * 4
    const vertexBuffer = new Buffer(
      this.engine,
      BufferBindFlag.VertexBuffer,
      byteLength,
      BufferUsage.Dynamic
    );

    const indexBuffer = new Buffer(
      this.engine,
      BufferBindFlag.IndexBuffer,
      this.indices,
      BufferUsage.Dynamic
    );

    this.indexBuffer = indexBuffer;
    this.vertexBuffer = vertexBuffer;

    mesh.setVertexBufferBinding(vertexBuffer, vertexStride);
    mesh.setIndexBufferBinding(indexBuffer, IndexFormat.UInt16);
    mesh.setVertexElements(vertexElements);
    mesh.addSubMesh(0, this.indices.length);

    this.mesh = mesh;

    this.setMaterial(new SkeletonMaterial(this.engine));
  }

  setBufferData(): void {
    const { indicesLength } = this;
    let indexStart = this.verticesLength / 9;

    this.vertexBuffer.setData(this.vertices);
    this.verticesLength = this.verticesLength;

    let indicesArray = this.indices;

    for (let i = this.indicesLength, j = 0; j < indicesLength; i++, j++) {
      indicesArray[i] = this.indices[j] + indexStart;
    }

    this.indicesLength += indicesLength;
    this.indexBuffer.setData(indicesArray);
  }
}