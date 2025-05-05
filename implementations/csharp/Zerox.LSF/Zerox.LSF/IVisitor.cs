using System;

namespace Zerox.LSF
{
    /// <summary>
    /// Defines the contract for a visitor that traverses an LSF DOM.
    /// </summary>
    /// <typeparam name="TResult">The type of result produced by the visitor.</typeparam>
    public interface IVisitor<TResult>
    {
        /// <summary>
        /// Visits an LSF Object node.
        /// </summary>
        /// <param name="navigator">The DOM navigator.</param>
        /// <param name="objectNodeIndex">The index of the object node to visit.</param>
        /// <param name="objectNode">The object node itself.</param>
        /// <returns>The result of visiting the object node.</returns>
        TResult VisitObject(DOMNavigator navigator, int objectNodeIndex, LSFNode objectNode);

        /// <summary>
        /// Visits an LSF Field node.
        /// </summary>
        /// <param name="navigator">The DOM navigator.</param>
        /// <param name="fieldNodeIndex">The index of the field node to visit.</param>
        /// <param name="fieldNode">The field node itself.</param>
        /// <returns>The result of visiting the field node.</returns>
        TResult VisitField(DOMNavigator navigator, int fieldNodeIndex, LSFNode fieldNode);

        /// <summary>
        /// Visits an LSF Value node.
        /// </summary>
        /// <param name="navigator">The DOM navigator.</param>
        /// <param name="valueNodeIndex">The index of the value node to visit.</param>
        /// <param name="valueNode">The value node itself.</param>
        /// <returns>The result of visiting the value node.</returns>
        TResult VisitValue(DOMNavigator navigator, int valueNodeIndex, LSFNode valueNode);

        // Optional: Add methods for entering/exiting nodes if needed for complex visitors
        // void EnterObject(DOMNavigator navigator, int objectNodeIndex, LSFNode objectNode);
        // void ExitObject(DOMNavigator navigator, int objectNodeIndex, LSFNode objectNode);
        // Similar for Field/Value
    }
} 