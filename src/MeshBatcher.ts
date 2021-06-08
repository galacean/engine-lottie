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

export class MeshBatcher extends MeshRenderer {
  private static VERTEX_SIZE = 9;

  vertices: Float32Array;
  private indices: Uint16Array;

  private indexBuffer: Buffer;
  vertexBuffer: Buffer;

  private verticesLength = 0;
  private indicesLength = 0;

  constructor(entity: Entity) {
    super(entity);
  }

  initMesh(maxVertices: number) {
    const mesh = new BufferMesh(this.engine, 'lottie_batch_mesh');
    
    const vertices = new Float32Array(maxVertices * MeshBatcher.VERTEX_SIZE);
    const indices = new Uint16Array(maxVertices * 3 / 2);

    this.vertices = vertices;
    this.indices = indices;

    const vertexElements = [
      new VertexElement('POSITION', 0, VertexElementFormat.Vector3, 0),
      new VertexElement('COLOR_0', 12, VertexElementFormat.Vector4, 0),
      new VertexElement('TEXCOORD_0', 28, VertexElementFormat.Vector2, 0),
    ];

    const vertexStride = 36 // 12 + 16 + 8
    const byteLength = vertexStride * maxVertices
    const vertexBuffer = new Buffer(
      this.engine,
      BufferBindFlag.VertexBuffer,
      byteLength,
      BufferUsage.Dynamic
    );

    const indexBuffer = new Buffer(
      this.engine,
      BufferBindFlag.IndexBuffer,
      indices,
      BufferUsage.Dynamic
    );

    this.indexBuffer = indexBuffer;
    this.vertexBuffer = vertexBuffer;

    mesh.setVertexBufferBinding(vertexBuffer, vertexStride);
    mesh.setIndexBufferBinding(indexBuffer, IndexFormat.UInt16);
    mesh.setVertexElements(vertexElements);
    mesh.addSubMesh(0, indices.length);

    this.mesh = mesh;
  }

  initMaterial() {
    this.setMaterial(new SkeletonMaterial(this.engine));
  }

  clear() {}

  begin() {
    this.verticesLength = 0;
    this.indicesLength = 0;
  }

  canBatch(verticesLength: number, indicesLength: number) {
    if (this.indicesLength + indicesLength >= this.indices.byteLength / 2) return false;
    if (this.verticesLength + verticesLength >= this.vertices.byteLength / 2) return false;
    return true;
  }

  batch(
    vertices: ArrayLike<number>, 
    verticesLength: number, 
    indices: ArrayLike<number>, 
    indicesLength: number, 
    z: number = 0
  ) {
    let indexStart = this.verticesLength / MeshBatcher.VERTEX_SIZE;
    let vertexBuffer = this.vertices;
    let i = this.verticesLength;
    let j = 0;

    for (; j < verticesLength; ) {
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
      vertexBuffer[i++] = vertices[j++];
    }
    this.vertexBuffer.setData(vertexBuffer);
    this.verticesLength = i;

    let indicesArray = this.indices;

    for (i = this.indicesLength, j = 0; j < indicesLength; i++, j++) {
      indicesArray[i] = indices[j] + indexStart;
    }
      // console.log(vertices, indicesArray )

    this.indicesLength += indicesLength;
    this.indexBuffer.setData(indicesArray);
  }

  updateVertices (vertices) {
    const { verticesLength } = this;
    let vertexBuffer = this.vertices;

    for (let i = 0 ; i < verticesLength; i++) {
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
      vertexBuffer[i++] = vertices[i++];
    }

    this.vertexBuffer.setData(vertexBuffer);
  }

  end() {
    // end batch
  }
}